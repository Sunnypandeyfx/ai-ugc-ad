import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stepIndex, type StepKey } from "@/lib/projects";

export type OwnProject = {
  id: string;
  user_id: string;
  current_step: string;
  product_id: string | null;
};

export async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getOwnProject(userId: string, projectId: string): Promise<OwnProject | null> {
  const { data } = await createAdminClient()
    .from("projects")
    .select("id, user_id, current_step, product_id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

// Steps only move forward: editing an earlier step never re-locks later ones.
export async function reachStep(project: OwnProject, step: StepKey): Promise<void> {
  const update: Record<string, string> = { updated_at: new Date().toISOString() };
  if (stepIndex(step) > stepIndex(project.current_step)) update.current_step = step;
  await createAdminClient()
    .from("projects")
    .update(update)
    .eq("id", project.id)
    .eq("user_id", project.user_id);
}
