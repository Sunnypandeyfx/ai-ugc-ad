"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentUserId, reachStep } from "@/lib/projects-server";
import { loadProjectContext } from "@/lib/project-context";
import { stepIndex } from "@/lib/projects";
import { writeConcepts } from "@/lib/ai/concepts";
import { writeStoryboard } from "@/lib/ai/storyboard";
import { saveShots } from "@/lib/storyboard-server";
import { MAX_CONCEPT_ROUNDS, MAX_STORYBOARD_GENERATIONS, type Concept } from "@/lib/storyboard";

type Result = { error: string | null };

function refresh(projectId: string) {
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard");
}

export async function generateConcepts(projectId: string): Promise<Result> {
  const userId = await currentUserId();
  if (!userId) return { error: "Not signed in." };
  const { ctx, error } = await loadProjectContext(userId, projectId);
  if (!ctx) return { error };
  if (stepIndex(ctx.project.current_step) < stepIndex("concept")) return { error: "Finish the brief first." };

  const rounds = ctx.project.concept_rounds;
  if (rounds >= MAX_CONCEPT_ROUNDS) {
    return { error: `You've generated ${MAX_CONCEPT_ROUNDS} rounds of concepts for this project, which is the limit.` };
  }

  const admin = createAdminClient();
  // Claim the round first so a double-click can't run two generations.
  const { data: claimed } = await admin
    .from("projects")
    .update({ concept_rounds: rounds + 1 })
    .eq("id", projectId)
    .eq("user_id", userId)
    .eq("concept_rounds", rounds)
    .select("id");
  if (!claimed?.length) return { error: "Concepts are already being written." };

  try {
    const { data: previous } = await admin
      .from("project_concepts")
      .select("title")
      .eq("project_id", projectId)
      .eq("user_id", userId);
    const drafts = await writeConcepts(ctx, (previous ?? []).map((c) => c.title));
    const { error: insertError } = await admin.from("project_concepts").insert(
      drafts.map((c, i) => ({ ...c, project_id: projectId, user_id: userId, round: rounds + 1, position: i + 1 })),
    );
    if (insertError) throw new Error(insertError.message);
  } catch (err) {
    console.error("concept generation failed", projectId, err);
    await admin
      .from("projects")
      .update({ concept_rounds: rounds })
      .eq("id", projectId)
      .eq("user_id", userId)
      .eq("concept_rounds", rounds + 1);
    return { error: "Writing concepts failed. Please try again." };
  }

  await admin
    .from("projects")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("user_id", userId);
  refresh(projectId);
  return { error: null };
}

async function buildStoryboard(userId: string, projectId: string, conceptId: string): Promise<Result> {
  const { ctx, error } = await loadProjectContext(userId, projectId);
  if (!ctx) return { error };

  const generations = ctx.project.storyboard_generations;
  if (generations >= MAX_STORYBOARD_GENERATIONS) {
    return { error: `This project has reached the limit of ${MAX_STORYBOARD_GENERATIONS} storyboard generations.` };
  }

  const admin = createAdminClient();
  const { data: concept } = await admin
    .from("project_concepts")
    .select("id, round, position, title, logline, hook, beats, visual_style, rationale, facts_used, created_at")
    .eq("id", conceptId)
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!concept) return { error: "Concept not found." };

  const { data: claimed } = await admin
    .from("projects")
    .update({ storyboard_generations: generations + 1 })
    .eq("id", projectId)
    .eq("user_id", userId)
    .eq("storyboard_generations", generations)
    .select("id");
  if (!claimed?.length) return { error: "A storyboard is already being written." };

  try {
    const draft = await writeStoryboard(ctx, concept as Concept);
    const now = new Date().toISOString();
    const { error: boardError } = await admin.from("project_storyboards").upsert({
      project_id: projectId,
      user_id: userId,
      concept_id: concept.id,
      title: draft.title,
      summary: draft.summary,
      cta: draft.cta,
      generated_at: now,
      approved_at: null,
      updated_at: now,
    });
    if (boardError) throw new Error(boardError.message);
    await saveShots(userId, projectId, draft.shots);
    await admin
      .from("projects")
      .update({ selected_concept_id: concept.id, status: "awaiting_approval" })
      .eq("id", projectId)
      .eq("user_id", userId);
  } catch (err) {
    console.error("storyboard generation failed", projectId, err);
    await admin
      .from("projects")
      .update({ storyboard_generations: generations })
      .eq("id", projectId)
      .eq("user_id", userId)
      .eq("storyboard_generations", generations + 1);
    return { error: "Writing the storyboard failed. Please try again." };
  }

  await reachStep(ctx.project, "storyboard");
  refresh(projectId);
  return { error: null };
}

export async function chooseConcept(projectId: string, conceptId: string): Promise<Result> {
  const userId = await currentUserId();
  if (!userId) return { error: "Not signed in." };
  const result = await buildStoryboard(userId, projectId, conceptId);
  if (result.error) return result;
  redirect(`/dashboard/projects/${projectId}?step=storyboard`);
}

export async function regenerateStoryboard(projectId: string): Promise<Result> {
  const userId = await currentUserId();
  if (!userId) return { error: "Not signed in." };
  const { data: project } = await createAdminClient()
    .from("projects")
    .select("selected_concept_id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!project?.selected_concept_id) return { error: "Choose a concept first." };
  return buildStoryboard(userId, projectId, project.selected_concept_id);
}
