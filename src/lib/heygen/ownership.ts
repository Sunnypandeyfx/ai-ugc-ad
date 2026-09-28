import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Every user's custom creators live in ONE shared HeyGen account (ours), so
// HeyGen itself can't stop user A from rendering with user B's private look
// or cloned voice. The avatar/voice ids on a generation came from the
// browser, so check them against our own records before spending anything.
export async function creatorUseError(
  admin: SupabaseClient,
  userId: string,
  avatarId: string,
  voiceId: string,
): Promise<string | null> {
  const { data: avatarRows, error: avatarError } = await admin
    .from("custom_avatars")
    .select("user_id, training_status, consent_status")
    .eq("heygen_look_id", avatarId);
  if (avatarError) return "Could not verify the selected creator.";

  if (avatarRows && avatarRows.length > 0) {
    const own = avatarRows.find((r) => r.user_id === userId);
    if (!own) return "That creator isn't available on your account.";
    if (own.training_status !== "ready") return "That creator is still training.";
    if (own.consent_status !== "approved") {
      return "That creator can't be used until the person in the footage approves consent.";
    }
  }

  // Cloned voices come from digital twins; prompt avatars reuse public
  // voices, which anyone may use.
  const { data: voiceRows, error: voiceError } = await admin
    .from("custom_avatars")
    .select("user_id")
    .eq("voice_id", voiceId)
    .eq("source", "digital_twin");
  if (voiceError) return "Could not verify the selected voice.";
  if (voiceRows?.some((r) => r.user_id !== userId)) {
    return "That voice isn't available on your account.";
  }

  return null;
}
