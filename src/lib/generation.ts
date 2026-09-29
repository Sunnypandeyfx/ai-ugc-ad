import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { ASSET_BUCKET } from "@/lib/product";
import type { Shot } from "@/lib/storyboard";

export const MAX_SHOT_GENERATIONS = 5;

// Vercel's serverless functions have no fixed public hostname across
// deploys; VERCEL_URL is set at runtime to the current deployment's host.
// APP_URL lets a custom production domain override it once one exists.
export function baseUrl(): string | null {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return null;
}

// The provider needs a URL it can fetch the starting frame from. Product
// photos live in a private bucket, so we hand it a signed URL rather than
// making the bucket public. One hour comfortably outlasts generation time.
export async function signedMainAssetUrl(
  userId: string,
  productId: string,
): Promise<{ path: string; url: string } | null> {
  const admin = createAdminClient();
  const { data: asset } = await admin
    .from("product_assets")
    .select("storage_path")
    .eq("product_id", productId)
    .eq("user_id", userId)
    .eq("kind", "main")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!asset) return null;

  const { data: signed } = await admin.storage
    .from(ASSET_BUCKET)
    .createSignedUrl(asset.storage_path, 3600);
  if (!signed?.signedUrl) return null;
  return { path: asset.storage_path, url: signed.signedUrl };
}

// Feeds the shot's own description straight to the video model. Nothing
// here adds new claims — it's the same scene/camera text the customer
// already reviewed and approved on the storyboard.
export function buildShotPrompt(shot: Pick<Shot, "scene" | "camera" | "shot_type">): string {
  const parts = [shot.scene];
  if (shot.camera) parts.push(`Camera: ${shot.camera}.`);
  if (shot.shot_type === "lifestyle") parts.push("Natural, editorial motion.");
  else parts.push("Keep the product's design, label and proportions exactly as shown.");
  return parts.join(" ").slice(0, 2000);
}
