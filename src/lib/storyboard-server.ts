import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Shot, ShotFields } from "@/lib/storyboard";

const SHOT_COLUMNS =
  "id, position, shot_type, duration_seconds, scene, camera, on_screen_text, voiceover, sound, facts_used";

export async function loadShots(userId: string, projectId: string): Promise<Shot[]> {
  const { data } = await createAdminClient()
    .from("storyboard_shots")
    .select(SHOT_COLUMNS)
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("position");
  return (data ?? []) as Shot[];
}

// Writes the full ordered shot list. Existing shots keep their ids (later
// generations attach to them); ids must come from loadShots, never the client.
export async function saveShots(
  userId: string,
  projectId: string,
  shots: (ShotFields & { id?: string })[],
): Promise<void> {
  const admin = createAdminClient();
  const existing = await loadShots(userId, projectId);
  const keep = new Set(shots.map((s) => s.id).filter(Boolean));
  const removed = existing.filter((s) => !keep.has(s.id)).map((s) => s.id);

  if (removed.length) {
    const { error } = await admin
      .from("storyboard_shots")
      .delete()
      .in("id", removed)
      .eq("project_id", projectId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
  }

  const now = new Date().toISOString();
  const rows = shots.map((s, i) => ({
    id: s.id ?? crypto.randomUUID(),
    project_id: projectId,
    user_id: userId,
    position: i + 1,
    shot_type: s.shot_type,
    duration_seconds: s.duration_seconds,
    scene: s.scene,
    camera: s.camera,
    on_screen_text: s.on_screen_text,
    voiceover: s.voiceover,
    sound: s.sound,
    facts_used: s.facts_used,
    updated_at: now,
  }));
  if (rows.length) {
    const { error } = await admin.from("storyboard_shots").upsert(rows, { onConflict: "id" });
    if (error) throw new Error(error.message);
  }
}

// Any edit after approval withdraws the approval: nothing is generated from
// a storyboard the customer hasn't signed off in its current form.
export async function markStoryboardEdited(userId: string, projectId: string): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  await admin
    .from("project_storyboards")
    .update({ approved_at: null, updated_at: now })
    .eq("project_id", projectId)
    .eq("user_id", userId);
  await admin
    .from("projects")
    .update({ status: "awaiting_approval", updated_at: now })
    .eq("id", projectId)
    .eq("user_id", userId);
}
