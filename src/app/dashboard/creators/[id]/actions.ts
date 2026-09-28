"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requestAvatarConsent } from "@/lib/heygen/client";

export type ConsentResult = { error: string | null; consentUrl: string | null };

export async function startConsent(customAvatarId: string): Promise<ConsentResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in.", consentUrl: null };

  const { data: avatar, error } = await supabase
    .from("custom_avatars")
    .select("id, heygen_group_id, training_status")
    .eq("id", customAvatarId)
    .single();

  if (error || !avatar) return { error: "Creator not found.", consentUrl: null };
  if (avatar.training_status !== "ready") {
    return { error: "Training isn't finished yet.", consentUrl: null };
  }
  if (!avatar.heygen_group_id) {
    return { error: "Missing HeyGen reference.", consentUrl: null };
  }

  try {
    const { consentUrl, consentStatus } = await requestAvatarConsent(
      avatar.heygen_group_id,
    );
    await supabase
      .from("custom_avatars")
      .update({
        consent_url: consentUrl,
        consent_status: consentStatus || "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", customAvatarId);

    revalidatePath(`/dashboard/creators/${customAvatarId}`);
    return { error: null, consentUrl };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not start consent.",
      consentUrl: null,
    };
  }
}
