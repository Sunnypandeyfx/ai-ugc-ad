"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentUserId, getOwnProject, reachStep } from "@/lib/projects-server";
import { analyzeProductImages, type AnalysisImage } from "@/lib/ai/analyzeProduct";
import {
  ASSET_BUCKET,
  isAnalysisRunning,
  FACT_LIMITS,
  MAX_ANALYSES_PER_PRODUCT,
  assetKind,
  type ConfirmedFacts,
} from "@/lib/product";

type Result = { error: string | null };

function refresh(projectId: string) {
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard");
}

export async function ensureProduct(
  projectId: string,
): Promise<{ productId: string; error: null } | { productId: null; error: string }> {
  const userId = await currentUserId();
  if (!userId) return { productId: null, error: "Not signed in." };
  const project = await getOwnProject(userId, projectId);
  if (!project) return { productId: null, error: "Project not found." };
  if (project.product_id) return { productId: project.product_id, error: null };

  const admin = createAdminClient();
  const { data: product, error } = await admin
    .from("products")
    .insert({ user_id: userId, name: "Untitled product" })
    .select("id")
    .single();
  if (error || !product) return { productId: null, error: error?.message ?? "Could not create product." };

  // Two uploads started at once can both get here; only one link wins.
  const { data: linked } = await admin
    .from("projects")
    .update({ product_id: product.id, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("user_id", userId)
    .is("product_id", null)
    .select("id");

  if (!linked || linked.length === 0) {
    await admin.from("products").delete().eq("id", product.id).eq("user_id", userId);
    const again = await getOwnProject(userId, projectId);
    if (!again?.product_id) return { productId: null, error: "Could not link product." };
    return { productId: again.product_id, error: null };
  }
  return { productId: product.id, error: null };
}

export async function registerAsset(projectId: string, kind: string, path: string): Promise<Result> {
  const userId = await currentUserId();
  if (!userId) return { error: "Not signed in." };
  const spec = assetKind(kind);
  if (!spec) return { error: "Unknown photo type." };
  const project = await getOwnProject(userId, projectId);
  if (!project?.product_id) return { error: "Project not found." };

  const folder = `${userId}/${project.product_id}`;
  const fileName = path.slice(folder.length + 1);
  if (!path.startsWith(`${folder}/`) || !/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(fileName)) {
    return { error: "Invalid upload path." };
  }

  const admin = createAdminClient();
  const { data: listed } = await admin.storage.from(ASSET_BUCKET).list(folder, { search: fileName });
  if (!listed?.some((f) => f.name === fileName)) return { error: "Upload not found. Please try again." };

  const { data: existing } = await admin
    .from("product_assets")
    .select("id, storage_path")
    .eq("product_id", project.product_id)
    .eq("user_id", userId)
    .eq("kind", spec.key);

  if (!spec.single && (existing?.length ?? 0) >= spec.max) {
    await admin.storage.from(ASSET_BUCKET).remove([path]);
    return { error: `You can add up to ${spec.max} ${spec.label.toLowerCase()}.` };
  }

  const { error } = await admin.from("product_assets").insert({
    product_id: project.product_id,
    user_id: userId,
    kind: spec.key,
    storage_path: path,
  });
  if (error) return { error: error.message };

  if (spec.single && existing && existing.length > 0) {
    await admin
      .from("product_assets")
      .delete()
      .in("id", existing.map((a) => a.id));
    await admin.storage.from(ASSET_BUCKET).remove(existing.map((a) => a.storage_path));
  }

  await admin
    .from("products")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", project.product_id)
    .eq("user_id", userId);
  refresh(projectId);
  return { error: null };
}

export async function deleteAsset(projectId: string, assetId: string): Promise<Result> {
  const userId = await currentUserId();
  if (!userId) return { error: "Not signed in." };
  const project = await getOwnProject(userId, projectId);
  if (!project?.product_id) return { error: "Project not found." };

  const admin = createAdminClient();
  const { data: removed } = await admin
    .from("product_assets")
    .delete()
    .eq("id", assetId)
    .eq("product_id", project.product_id)
    .eq("user_id", userId)
    .select("storage_path");
  if (!removed || removed.length === 0) return { error: "Photo not found." };

  await admin.storage.from(ASSET_BUCKET).remove(removed.map((a) => a.storage_path));
  refresh(projectId);
  return { error: null };
}

const ANALYSIS_ORDER = ["main", "front", "side", "back", "logo", "reference", "brand"];
const ANALYSIS_LIMITS: Record<string, number> = { reference: 3, brand: 2 };
// Anthropic caps a request at 32 MB and base64 adds a third; stay well under.
const ANALYSIS_MAX_BYTES = 18 * 1024 * 1024;

export async function analyzeProduct(projectId: string): Promise<Result> {
  const userId = await currentUserId();
  if (!userId) return { error: "Not signed in." };
  const project = await getOwnProject(userId, projectId);
  if (!project?.product_id) return { error: "Add a main photo first." };

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("id, analysis_status, analysis_count, analysis_started_at")
    .eq("id", project.product_id)
    .eq("user_id", userId)
    .single();
  if (!product) return { error: "Product not found." };

  if (isAnalysisRunning(product.analysis_status, product.analysis_started_at)) {
    return { error: "Analysis is already running." };
  }
  if (product.analysis_count >= MAX_ANALYSES_PER_PRODUCT) {
    return {
      error: `This product has been analyzed ${MAX_ANALYSES_PER_PRODUCT} times, which is the limit. You can still fill in the details yourself.`,
    };
  }

  const { data: assets } = await admin
    .from("product_assets")
    .select("kind, storage_path")
    .eq("product_id", product.id)
    .eq("user_id", userId)
    .order("created_at");
  if (!assets?.some((a) => a.kind === "main")) return { error: "Add a main photo first." };

  // Optimistic lock on the count so double-clicks can't run two analyses.
  const { data: claimed } = await admin
    .from("products")
    .update({
      analysis_status: "running",
      analysis_error: null,
      analysis_count: product.analysis_count + 1,
      analysis_started_at: new Date().toISOString(),
    })
    .eq("id", product.id)
    .eq("user_id", userId)
    .eq("analysis_count", product.analysis_count)
    .select("id");
  if (!claimed || claimed.length === 0) return { error: "Analysis is already running." };

  try {
    const picked = ANALYSIS_ORDER.flatMap((kind) =>
      assets.filter((a) => a.kind === kind).slice(0, ANALYSIS_LIMITS[kind] ?? 1),
    );
    const images: AnalysisImage[] = [];
    let total = 0;
    for (const asset of picked) {
      const { data: blob } = await admin.storage.from(ASSET_BUCKET).download(asset.storage_path);
      if (!blob) continue;
      if (total + blob.size > ANALYSIS_MAX_BYTES) break;
      total += blob.size;
      const mediaType = asset.storage_path.endsWith(".png")
        ? "image/png"
        : asset.storage_path.endsWith(".webp")
          ? "image/webp"
          : "image/jpeg";
      images.push({
        label: assetKind(asset.kind)?.label ?? asset.kind,
        mediaType,
        base64: Buffer.from(await blob.arrayBuffer()).toString("base64"),
      });
    }
    if (images.length === 0) throw new Error("Could not read your photos. Try re-uploading them.");

    const analysis = await analyzeProductImages(images);
    await admin
      .from("products")
      .update({
        ai_analysis: analysis,
        analysis_status: "ready",
        analyzed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id)
      .eq("user_id", userId);
    refresh(projectId);
    return { error: null };
  } catch (err) {
    console.error("product analysis failed", projectId, err);
    const message = err instanceof Error ? err.message : "Analysis failed.";
    await admin
      .from("products")
      .update({ analysis_status: "failed", analysis_error: message.slice(0, 300) })
      .eq("id", product.id)
      .eq("user_id", userId);
    refresh(projectId);
    return { error: "Analysis failed. You can try again or fill in the details yourself." };
  }
}

export type ConfirmState = { error: string | null };

export async function confirmProduct(
  projectId: string,
  _prev: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  const userId = await currentUserId();
  if (!userId) return { error: "Not signed in." };
  const project = await getOwnProject(userId, projectId);
  if (!project?.product_id) return { error: "Add a main photo first." };

  const field = (key: string) => String(formData.get(key) || "").trim();
  const confirmed: ConfirmedFacts = {
    name: field("name"),
    brand_name: field("brand_name"),
    category: field("category"),
    description: field("description"),
    facts: formData
      .getAll("fact")
      .map((f) => String(f).trim())
      .filter(Boolean),
  };

  if (!confirmed.name) return { error: "Enter the product name." };
  if (confirmed.name.length > FACT_LIMITS.name) return { error: "The product name is too long." };
  if (confirmed.brand_name.length > FACT_LIMITS.brand_name) return { error: "The brand name is too long." };
  if (confirmed.category.length > FACT_LIMITS.category) return { error: "The category is too long." };
  if (confirmed.description.length > FACT_LIMITS.description) {
    return { error: `Keep the description under ${FACT_LIMITS.description} characters.` };
  }
  if (confirmed.facts.length > FACT_LIMITS.facts) {
    return { error: `Keep it to ${FACT_LIMITS.facts} facts or fewer.` };
  }
  if (confirmed.facts.some((f) => f.length > FACT_LIMITS.fact)) {
    return { error: `Keep each fact under ${FACT_LIMITS.fact} characters.` };
  }
  if (formData.get("confirm") !== "yes") {
    return { error: "Tick the box to confirm these details are accurate." };
  }

  const admin = createAdminClient();
  const { count } = await admin
    .from("product_assets")
    .select("id", { count: "exact", head: true })
    .eq("product_id", project.product_id)
    .eq("user_id", userId)
    .eq("kind", "main");
  if (!count) return { error: "Add a main photo first." };

  const now = new Date().toISOString();
  const { error } = await admin
    .from("products")
    .update({
      name: confirmed.name,
      brand_name: confirmed.brand_name || null,
      category: confirmed.category || null,
      description: confirmed.description || null,
      confirmed_facts: confirmed,
      confirmed_at: now,
      updated_at: now,
    })
    .eq("id", project.product_id)
    .eq("user_id", userId);
  if (error) return { error: error.message };

  await reachStep(project, "brief");
  refresh(projectId);
  redirect(`/dashboard/projects/${projectId}?step=brief`);
}
