"use server";

import { createClient } from "@/lib/supabase/server";
import { createDigitalTwin } from "@/lib/heygen/client";

export type CreateTwinResult = { error: string | null; id: string | null };

export async function createCustomAvatarRecord(
  name: string,
  assetId: string,
): Promise<CreateTwinResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in.", id: null };
  if (!name.trim()) return { error: "Give this creator a name.", id: null };
  if (!assetId) return { error: "Upload didn't complete.", id: null };

  const { data: avatarRow, error: insertError } = await supabase
    .from("custom_avatars")
    .insert({ user_id: user.id, name: name.trim(), training_status: "training" })
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

    await supabase
      .from("custom_avatars")
      .update({
        heygen_group_id: groupId,
        heygen_look_id: lookId,
        voice_id: voiceId,
      })
      .eq("id", avatarRow.id);
  } catch (err) {
    await supabase
      .from("custom_avatars")
      .update({
        training_status: "failed",
        error: err instanceof Error ? err.message : "HeyGen rejected the footage.",
      })
      .eq("id", avatarRow.id);
  }

  return { error: null, id: avatarRow.id };
}
