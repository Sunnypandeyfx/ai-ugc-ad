"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createDigitalTwin,
  createPromptAvatar,
  getDefaultVoiceId,
} from "@/lib/heygen/client";

export type CreateTwinResult = { error: string | null; id: string | null };

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function createCustomAvatarRecord(
  name: string,
  assetId: string,
): Promise<CreateTwinResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Not signed in.", id: null };
  if (!name.trim()) return { error: "Give this creator a name.", id: null };
  if (!assetId) return { error: "Upload didn't complete.", id: null };

  const admin = createAdminClient();
  const { data: avatarRow, error: insertError } = await admin
    .from("custom_avatars")
    .insert({
      user_id: userId,
      name: name.trim(),
      source: "digital_twin",
      training_status: "training",
    })
    .select("id")
    .single();

  if (insertError || !avatarRow) {
    return { error: insertError?.message || "Could not save creator.", id: null };
  }

  try {
    const { groupId, lookId, voiceId } = await createDigitalTwin({
      name: name.trim(),
      assetId,
    });

    await admin
      .from("custom_avatars")
      .update({ heygen_group_id: groupId, heygen_look_id: lookId, voice_id: voiceId })
      .eq("id", avatarRow.id)
      .eq("user_id", userId);
  } catch (err) {
    await admin
      .from("custom_avatars")
      .update({
        training_status: "failed",
        error: err instanceof Error ? err.message : "HeyGen rejected the footage.",
      })
      .eq("id", avatarRow.id)
      .eq("user_id", userId);
  }

  return { error: null, id: avatarRow.id };
}

export async function createGeneratedAvatarRecord(
  name: string,
  prompt: string,
  gender: "male" | "female",
): Promise<CreateTwinResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Not signed in.", id: null };
  if (!name.trim()) return { error: "Give this creator a name.", id: null };
  if (!prompt.trim()) return { error: "Describe the character you want.", id: null };
  const voiceGender = gender === "male" ? "male" : "female";

  const admin = createAdminClient();
  const { data: avatarRow, error: insertError } = await admin
    .from("custom_avatars")
    .insert({
      user_id: userId,
      name: name.trim(),
      source: "prompt",
      training_status: "training",
      // Synthetic characters depict no real person, so HeyGen requires no consent step.
      consent_status: "approved",
    })
    .select("id")
    .single();

  if (insertError || !avatarRow) {
    return { error: insertError?.message || "Could not save creator.", id: null };
  }

  try {
    const [{ groupId, lookId }, voiceId] = await Promise.all([
      createPromptAvatar({ name: name.trim(), prompt: prompt.trim().slice(0, 1000) }),
      getDefaultVoiceId(voiceGender),
    ]);

    await admin
      .from("custom_avatars")
      .update({ heygen_group_id: groupId, heygen_look_id: lookId, voice_id: voiceId })
      .eq("id", avatarRow.id)
      .eq("user_id", userId);
  } catch (err) {
    await admin
      .from("custom_avatars")
      .update({
        training_status: "failed",
        error: err instanceof Error ? err.message : "HeyGen rejected the prompt.",
      })
      .eq("id", avatarRow.id)
      .eq("user_id", userId);
  }

  return { error: null, id: avatarRow.id };
}
