"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentUserId, getOwnProject, reachStep } from "@/lib/projects-server";
import { loadShots, markStoryboardEdited, saveShots } from "@/lib/storyboard-server";
import { MAX_SHOTS, cleanShot, totalDuration, type Shot, type ShotFields } from "@/lib/storyboard";

export type ShotFormState = { error: string | null; saved: boolean };
type Result = { error: string | null };

function refresh(projectId: string) {
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard");
}

async function ownStoryboard(projectId: string) {
  const userId = await currentUserId();
  if (!userId) return null;
  const project = await getOwnProject(userId, projectId);
  if (!project) return null;
  const shots = await loadShots(userId, projectId);
  if (shots.length === 0) return null;
  return { userId, project, shots };
}

function fromForm(formData: FormData, existing?: Shot) {
  const get = (key: string) => String(formData.get(key) ?? "");
  // Customer-written text is theirs to stand behind, so facts_used (which
  // tracks confirmed facts the AI relied on) is carried over, not re-derived.
  return cleanShot(
    {
      shot_type: get("shot_type"),
      duration_seconds: get("duration_seconds"),
      scene: get("scene"),
      camera: get("camera"),
      on_screen_text: get("on_screen_text"),
      voiceover: get("voiceover"),
      sound: get("sound"),
      facts_used: existing?.facts_used ?? [],
    },
    existing?.facts_used ?? [],
  );
}

async function commit(userId: string, projectId: string, shots: (ShotFields & { id?: string })[]) {
  await saveShots(userId, projectId, shots);
  await markStoryboardEdited(userId, projectId);
  refresh(projectId);
}

export async function saveShot(
  projectId: string,
  shotId: string,
  _prev: ShotFormState,
  formData: FormData,
): Promise<ShotFormState> {
  const board = await ownStoryboard(projectId);
  if (!board) return { error: "Storyboard not found.", saved: false };
  const existing = board.shots.find((s) => s.id === shotId);
  if (!existing) return { error: "Shot not found.", saved: false };
  const fields = fromForm(formData, existing);
  if (!fields) return { error: "Describe what's on screen.", saved: false };

  await commit(
    board.userId,
    projectId,
    board.shots.map((s) => (s.id === shotId ? { ...s, ...fields } : s)),
  );
  return { error: null, saved: true };
}

export async function addShot(projectId: string, _prev: ShotFormState, formData: FormData): Promise<ShotFormState> {
  const board = await ownStoryboard(projectId);
  if (!board) return { error: "Storyboard not found.", saved: false };
  if (board.shots.length >= MAX_SHOTS) return { error: `A storyboard can have up to ${MAX_SHOTS} shots.`, saved: false };
  const fields = fromForm(formData);
  if (!fields) return { error: "Describe what's on screen.", saved: false };

  await commit(board.userId, projectId, [...board.shots, fields]);
  return { error: null, saved: true };
}

export async function deleteShot(projectId: string, shotId: string): Promise<Result> {
  const board = await ownStoryboard(projectId);
  if (!board) return { error: "Storyboard not found." };
  if (board.shots.length <= 1) return { error: "A storyboard needs at least one shot." };
  if (!board.shots.some((s) => s.id === shotId)) return { error: "Shot not found." };

  await commit(board.userId, projectId, board.shots.filter((s) => s.id !== shotId));
  return { error: null };
}

export async function moveShot(projectId: string, shotId: string, direction: -1 | 1): Promise<Result> {
  const board = await ownStoryboard(projectId);
  if (!board) return { error: "Storyboard not found." };
  const shots = [...board.shots];
  const i = shots.findIndex((s) => s.id === shotId);
  const j = i + direction;
  if (i === -1 || j < 0 || j >= shots.length) return { error: null };
  [shots[i], shots[j]] = [shots[j], shots[i]];

  await commit(board.userId, projectId, shots);
  return { error: null };
}

export async function approveStoryboard(projectId: string): Promise<Result> {
  const board = await ownStoryboard(projectId);
  if (!board) return { error: "Storyboard not found." };

  const admin = createAdminClient();
  const { data: brief } = await admin
    .from("project_briefs")
    .select("duration_seconds")
    .eq("project_id", projectId)
    .eq("user_id", board.userId)
    .maybeSingle();
  if (!brief) return { error: "Brief not found." };

  const total = totalDuration(board.shots);
  if (total !== brief.duration_seconds) {
    return {
      error: `Your shots add up to ${total}s but the brief asks for ${brief.duration_seconds}s. Adjust shot lengths (or the brief) so they match.`,
    };
  }

  const now = new Date().toISOString();
  const { data: approved } = await admin
    .from("project_storyboards")
    .update({ approved_at: now, updated_at: now })
    .eq("project_id", projectId)
    .eq("user_id", board.userId)
    .select("project_id");
  if (!approved?.length) return { error: "Storyboard not found." };

  await admin
    .from("projects")
    .update({ status: "draft", updated_at: now })
    .eq("id", projectId)
    .eq("user_id", board.userId);
  await reachStep(board.project, "shots");
  refresh(projectId);
  redirect(`/dashboard/projects/${projectId}?step=storyboard`);
}
