"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ASPECT_RATIOS, type AspectRatio } from "@/lib/projects";

export type ProjectSettingsState = { error: string | null; saved: boolean };

async function updateOwnProject(
  projectId: string,
  values: Record<string, string>,
): Promise<ProjectSettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in.", saved: false };

  const { data, error } = await createAdminClient()
    .from("projects")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("user_id", user.id)
    .select("id");

  if (error) return { error: error.message, saved: false };
  if (!data || data.length === 0) return { error: "Project not found.", saved: false };

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { error: null, saved: true };
}

export async function saveProjectSettings(
  projectId: string,
  _prev: ProjectSettingsState,
  formData: FormData,
): Promise<ProjectSettingsState> {
  const title = String(formData.get("title") || "").trim();
  const aspectRatio = String(formData.get("aspectRatio") || "");

  if (!title) return { error: "Give the project a name.", saved: false };
  if (title.length > 80) return { error: "Keep the name under 80 characters.", saved: false };
  if (!ASPECT_RATIOS.includes(aspectRatio as AspectRatio)) {
    return { error: "Pick a supported aspect ratio.", saved: false };
  }

  return updateOwnProject(projectId, { title, aspect_ratio: aspectRatio });
}
