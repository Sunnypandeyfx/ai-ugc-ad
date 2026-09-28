"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAvatarVideo, scriptToNarration } from "@/lib/heygen/client";
import type { AdScript } from "@/lib/ai/generateScript";

export async function renderVideo(generationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not signed in.");

  const { data: generation, error } = await supabase
    .from("generations")
    .select("id, script, avatar_id, voice_id, status")
    .eq("id", generationId)
    .single();

  if (error || !generation) throw new Error("Ad not found.");
  if (generation.status !== "script_ready") {
    throw new Error("Script isn't ready yet.");
  }
  if (!generation.avatar_id || !generation.voice_id) {
    throw new Error("No creator was selected for this ad.");
  }

  await supabase
    .from("generations")
    .update({ video_status: "rendering", video_error: null })
    .eq("id", generationId);

  try {
    const narration = scriptToNarration(generation.script as AdScript);
    const { videoId } = await createAvatarVideo({
      avatarId: generation.avatar_id,
      voiceId: generation.voice_id,
      script: narration,
      title: `Backlot ad ${generationId}`,
    });

    await supabase
      .from("generations")
      .update({ heygen_video_id: videoId })
      .eq("id", generationId);
  } catch (err) {
    await supabase
      .from("generations")
      .update({
        video_status: "failed",
        video_error: err instanceof Error ? err.message : "Render failed to start.",
      })
      .eq("id", generationId);
  }

  revalidatePath(`/dashboard/${generationId}`);
}
