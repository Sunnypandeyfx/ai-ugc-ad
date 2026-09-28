"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateAdScript } from "@/lib/ai/generateScript";

export type CreateGenerationState = { error: string | null };

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
  const adType = String(formData.get("adType") || "ugc") as "ugc" | "cinematic";
  const image = formData.get("image") as File | null;

  if (!name || !description || !audience) {
    return { error: "Product name, description, and audience are required." };
  }

  let imagePath: string | null = null;
  if (image && image.size > 0) {
    imagePath = `${user.id}/${randomUUID()}-${image.name}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(imagePath, image);
    if (uploadError) {
      return { error: `Image upload failed: ${uploadError.message}` };
    }
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({ user_id: user.id, name, description, image_path: imagePath })
    .select("id")
    .single();

  if (productError || !product) {
    return { error: productError?.message || "Could not save product." };
  }

  const { data: generation, error: generationError } = await supabase
    .from("generations")
    .insert({
      user_id: user.id,
      product_id: product.id,
      ad_type: adType,
      audience,
      tone: tone || null,
      platform,
      status: "queued",
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
    });

    await supabase
      .from("generations")
      .update({ status: "script_ready", script, updated_at: new Date().toISOString() })
      .eq("id", generation.id);
  } catch (err) {
    await supabase
      .from("generations")
      .update({
        status: "failed",
        error: err instanceof Error ? err.message : "Generation failed.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", generation.id);
  }

  redirect(`/dashboard/${generation.id}`);
}
