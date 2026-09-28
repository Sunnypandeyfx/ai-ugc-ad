"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAdScript } from "@/lib/ai/generateScript";

export type CreateGenerationState = { error: string | null };

const DURATIONS = new Set([15, 30, 45, 60]);

export async function createGeneration(
  _prevState: CreateGenerationState,
  formData: FormData,
): Promise<CreateGenerationState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/new");

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const audience = String(formData.get("audience") || "").trim();
  const platform = String(formData.get("platform") || "TikTok");
  const tone = String(formData.get("tone") || "").trim();
  const adType: "ugc" | "cinematic" =
    formData.get("adType") === "cinematic" ? "cinematic" : "ugc";
  const requestedDuration = Number(formData.get("duration") || 30);
  const durationSeconds = DURATIONS.has(requestedDuration) ? requestedDuration : 30;
  const imagePaths = formData.getAll("imagePaths").map(String).filter(Boolean);
  const avatarId = String(formData.get("avatarId") || "").trim();
  const avatarName = String(formData.get("avatarName") || "").trim();
  const voiceId = String(formData.get("voiceId") || "").trim();
  const engine = String(formData.get("engine") || "").trim();

  if (!name || !description || !audience) {
    return { error: "Product name, description, and audience are required." };
  }
  // Paths come from the browser; only accept files in this user's own folder.
  if (imagePaths.some((p) => !p.startsWith(`${user.id}/`) || p.includes(".."))) {
    return { error: "One of the uploaded photos is invalid. Please re-upload it." };
  }

  const admin = createAdminClient();

  const { data: product, error: productError } = await admin
    .from("products")
    .insert({
      user_id: user.id,
      name,
      description,
      image_path: imagePaths[0] ?? null,
      image_paths: imagePaths,
    })
    .select("id")
    .single();

  if (productError || !product) {
    return { error: productError?.message || "Could not save product." };
  }

  const { data: generation, error: generationError } = await admin
    .from("generations")
    .insert({
      user_id: user.id,
      product_id: product.id,
      ad_type: adType,
      audience,
      tone: tone || null,
      platform,
      duration_seconds: durationSeconds,
      status: "queued",
      avatar_id: adType === "ugc" && avatarId ? avatarId : null,
      avatar_name: adType === "ugc" && avatarName ? avatarName : null,
      voice_id: adType === "ugc" && voiceId ? voiceId : null,
      engine: adType === "ugc" && engine ? engine : null,
    })
    .select("id")
    .single();

  if (generationError || !generation) {
    return { error: generationError?.message || "Could not start generation." };
  }

  try {
    const script = await generateAdScript({
      productName: name,
      productDescription: description,
      adType,
      audience,
      platform,
      tone,
      durationSeconds,
    });

    await admin
      .from("generations")
      .update({ status: "script_ready", script, updated_at: new Date().toISOString() })
      .eq("id", generation.id)
      .eq("user_id", user.id);
  } catch (err) {
    await admin
      .from("generations")
      .update({
        status: "failed",
        error: err instanceof Error ? err.message : "Generation failed.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", generation.id)
      .eq("user_id", user.id);
  }

  redirect(`/dashboard/${generation.id}`);
}
