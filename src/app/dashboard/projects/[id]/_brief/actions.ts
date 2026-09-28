"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentUserId, getOwnProject, reachStep } from "@/lib/projects-server";
import { stepIndex } from "@/lib/projects";
import {
  AD_STYLES,
  DURATIONS,
  LANGUAGES,
  MUSIC_MOODS,
  OBJECTIVES,
  PLATFORMS,
  TONES,
  VOICEOVERS,
  isOption,
  type BriefAdvanced,
} from "@/lib/brief";

export type BriefState = { error: string | null };

const LIMITS = { audience: 300, cta: 120, advanced: 400 } as const;

export async function saveBrief(
  projectId: string,
  _prev: BriefState,
  formData: FormData,
): Promise<BriefState> {
  const userId = await currentUserId();
  if (!userId) return { error: "Not signed in." };
  const project = await getOwnProject(userId, projectId);
  if (!project) return { error: "Project not found." };
  if (stepIndex(project.current_step) < stepIndex("brief")) {
    return { error: "Confirm your product details first." };
  }

  const field = (key: string) => String(formData.get(key) || "").trim();

  const objective = field("objective");
  const audience = field("audience");
  const platform = field("platform");
  const adStyle = field("ad_style");
  const tone = field("tone");
  const duration = Number(field("duration_seconds"));
  const cta = field("cta");

  if (!isOption(OBJECTIVES, objective)) return { error: "Pick an objective." };
  if (!audience) return { error: "Describe who the ad is for." };
  if (audience.length > LIMITS.audience) return { error: "Keep the audience under 300 characters." };
  if (!isOption(PLATFORMS, platform)) return { error: "Pick a platform." };
  if (!isOption(AD_STYLES, adStyle)) return { error: "Pick an ad style." };
  if (!isOption(TONES, tone)) return { error: "Pick a tone." };
  if (!(DURATIONS as readonly number[]).includes(duration)) return { error: "Pick a length." };
  if (cta.length > LIMITS.cta) return { error: "Keep the call to action under 120 characters." };

  const advanced: BriefAdvanced = {};
  for (const key of [
    "key_message",
    "offer",
    "must_include",
    "must_avoid",
    "visual_direction",
    "brand_colors",
  ] as const) {
    const value = field(key);
    if (value.length > LIMITS.advanced) return { error: "One of the advanced fields is too long." };
    if (value) advanced[key] = value;
  }
  const music = field("music");
  const voiceover = field("voiceover");
  const language = field("language") || "English";
  if (music && !isOption(MUSIC_MOODS, music)) return { error: "Pick a music option." };
  if (voiceover && !isOption(VOICEOVERS, voiceover)) return { error: "Pick a voiceover option." };
  if (!isOption(LANGUAGES, language)) return { error: "Pick a language." };
  if (music) advanced.music = music;
  if (voiceover) advanced.voiceover = voiceover;
  advanced.language = language;
  advanced.captions = formData.get("captions") === "on";

  const { error } = await createAdminClient()
    .from("project_briefs")
    .upsert({
      project_id: project.id,
      user_id: userId,
      objective,
      audience,
      platform,
      ad_style: adStyle,
      tone,
      duration_seconds: duration,
      cta: cta || null,
      advanced,
      updated_at: new Date().toISOString(),
    });
  if (error) return { error: error.message };

  await reachStep(project, "concept");
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard");
  redirect(`/dashboard/projects/${projectId}?step=concept`);
}
