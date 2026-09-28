"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createProject() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard");

  const { data: project, error } = await createAdminClient()
    .from("projects")
    .insert({ user_id: user.id })
    .select("id")
    .single();

  if (error || !project) {
    throw new Error(error?.message || "Could not create project.");
  }

  redirect(`/dashboard/projects/${project.id}`);
}
