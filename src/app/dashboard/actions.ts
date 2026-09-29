"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ASSET_BUCKET } from "@/lib/product";

export type DeleteState = { error: string | null };

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

export async function deleteProject(projectId: string): Promise<DeleteState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const admin = createAdminClient();
  const { data: project } = await admin
    .from("projects")
    .select("id, product_id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!project) return { error: "Project not found." };

  // Deleting the project row cascades its brief, concepts, storyboard,
  // shots, messages and jobs. It does not touch the product it points at
  // (products.image survives independently), so that — and its uploaded
  // photo files — are cleaned up explicitly below.
  if (project.product_id) {
    const { data: assets } = await admin
      .from("product_assets")
      .select("storage_path")
      .eq("product_id", project.product_id)
      .eq("user_id", user.id);
    if (assets && assets.length > 0) {
      await admin.storage.from(ASSET_BUCKET).remove(assets.map((a) => a.storage_path));
    }
  }

  const { error: deleteError } = await admin
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", user.id);
  if (deleteError) return { error: deleteError.message };

  if (project.product_id) {
    await admin.from("products").delete().eq("id", project.product_id).eq("user_id", user.id);
  }

  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteGeneration(generationId: string): Promise<DeleteState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const admin = createAdminClient();
  const { data: generation } = await admin
    .from("generations")
    .select("id, product_id")
    .eq("id", generationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!generation) return { error: "Ad not found." };

  const { error: deleteError } = await admin
    .from("generations")
    .delete()
    .eq("id", generationId)
    .eq("user_id", user.id);
  if (deleteError) return { error: deleteError.message };

  // The classic flow creates one product per generation, but check before
  // removing its photos in case that ever changes.
  const { count } = await admin
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("product_id", generation.product_id);
  if (!count) {
    const { data: product } = await admin
      .from("products")
      .select("image_path, image_paths")
      .eq("id", generation.product_id)
      .eq("user_id", user.id)
      .maybeSingle();
    const paths = new Set([...(product?.image_paths ?? []), ...(product?.image_path ? [product.image_path] : [])]);
    if (paths.size > 0) {
      await admin.storage.from("product-images").remove([...paths]);
    }
    await admin.from("products").delete().eq("id", generation.product_id).eq("user_id", user.id);
  }

  revalidatePath("/dashboard");
  return { error: null };
}
