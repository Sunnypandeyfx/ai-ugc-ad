"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentUserId, getOwnProject } from "@/lib/projects-server";
import { baseUrl, buildShotPrompt, signedMainAssetUrl, MAX_SHOT_GENERATIONS } from "@/lib/generation";
import { getVideoProvider } from "@/lib/providers/video";

export type GenerateShotState = { error: string | null };

const FRIENDLY_ERRORS: Record<string, string> = {
  already_generating: "This shot is already generating.",
  insufficient_credits: "You don't have enough credits for this. Add credits from Billing.",
};

function refresh(projectId: string) {
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard");
}

export async function generateShot(projectId: string, shotId: string): Promise<GenerateShotState> {
  const userId = await currentUserId();
  if (!userId) return { error: "Not signed in." };
  const project = await getOwnProject(userId, projectId);
  if (!project) return { error: "Project not found." };
  if (!project.product_id) return { error: "Product not found." };

  const admin = createAdminClient();
  const { data: shot } = await admin
    .from("storyboard_shots")
    .select("id, shot_type, scene, camera, duration_seconds, generation_count")
    .eq("id", shotId)
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!shot) return { error: "Shot not found." };
  if (shot.shot_type !== "product" && shot.shot_type !== "lifestyle") {
    return { error: "This shot type isn't ready to generate yet." };
  }
  if (shot.generation_count >= MAX_SHOT_GENERATIONS) {
    return { error: `This shot has reached the limit of ${MAX_SHOT_GENERATIONS} generations.` };
  }

  const { data: storyboard } = await admin
    .from("project_storyboards")
    .select("approved_at")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!storyboard?.approved_at) return { error: "Approve the storyboard first." };

  const { data: proj } = await admin
    .from("projects")
    .select("aspect_ratio")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();

  const image = await signedMainAssetUrl(userId, project.product_id);
  if (!image) return { error: "Add a main product photo before generating." };

  const provider = getVideoProvider();
  const cost = provider.estimateCredits(shot.duration_seconds);
  const prompt = buildShotPrompt(shot);

  const { data: reserved, error: reserveError } = await admin.rpc("reserve_shot_generation", {
    p_user_id: userId,
    p_project_id: projectId,
    p_shot_id: shotId,
    p_cost: cost,
    p_provider: provider.name,
    p_model: "veo3.1",
    p_prompt: prompt,
    p_input_image_path: image.path,
  });
  if (reserveError) return { error: reserveError.message };
  const row = reserved?.[0];
  if (!row) return { error: "Could not start generation." };
  if (row.error) return { error: FRIENDLY_ERRORS[row.error] ?? row.error };

  const jobId = row.job_id as string;
  const webhook = baseUrl();

  try {
    const submitted = await provider.submitImageToVideo({
      imageUrl: image.url,
      prompt,
      aspectRatio: (proj?.aspect_ratio as "9:16" | "16:9" | "1:1") ?? "9:16",
      durationSeconds: shot.duration_seconds,
      webhookUrl: webhook ? `${webhook}/api/webhooks/fal` : null,
    });
    await admin.rpc("mark_job_submitted", { p_job_id: jobId, p_provider_job_id: submitted.providerJobId });
  } catch (err) {
    console.error("shot generation submit failed", shotId, err);
    await admin.rpc("finalize_shot_generation", {
      p_job_id: jobId,
      p_webhook_request_id: null,
      p_status: "failed",
      p_video_url: null,
      p_error: "Could not reach the video provider.",
    });
    refresh(projectId);
    return { error: "Could not start generation. Your credit was not charged." };
  }

  refresh(projectId);
  return { error: null };
}

export async function revertShotToVersion(
  projectId: string,
  shotId: string,
  jobId: string,
): Promise<GenerateShotState> {
  const userId = await currentUserId();
  if (!userId) return { error: "Not signed in." };
  const admin = createAdminClient();

  const { data: job } = await admin
    .from("generation_jobs")
    .select("id, video_url, status")
    .eq("id", jobId)
    .eq("shot_id", shotId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!job || job.status !== "ready" || !job.video_url) return { error: "That version isn't available." };

  const { data: updated } = await admin
    .from("storyboard_shots")
    .update({ video_url: job.video_url, video_status: "ready", video_error: null, active_job_id: job.id })
    .eq("id", shotId)
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .select("id");
  if (!updated?.length) return { error: "Shot not found." };

  refresh(projectId);
  return { error: null };
}

export type JobStatusResult = {
  video_status: string;
  video_url: string | null;
  video_error: string | null;
};

// Polled by the client while a shot is generating. Mirrors the existing
// HeyGen video-status route: checks the provider directly and finalizes
// here rather than waiting on the webhook, so it also works in local dev
// (no public URL for fal to call back) and as a safety net in production.
export async function checkShotGeneration(projectId: string, shotId: string): Promise<JobStatusResult> {
  const userId = await currentUserId();
  if (!userId) return { video_status: "failed", video_url: null, video_error: "Not signed in." };

  const admin = createAdminClient();
  const { data: shot } = await admin
    .from("storyboard_shots")
    .select("video_status, video_url, video_error, active_job_id")
    .eq("id", shotId)
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!shot) return { video_status: "failed", video_url: null, video_error: "Shot not found." };

  if (shot.video_status !== "generating" && shot.video_status !== "queued") {
    return { video_status: shot.video_status, video_url: shot.video_url, video_error: shot.video_error };
  }
  if (!shot.active_job_id) return { video_status: shot.video_status, video_url: shot.video_url, video_error: shot.video_error };

  const { data: job } = await admin
    .from("generation_jobs")
    .select("provider_job_id, status")
    .eq("id", shot.active_job_id)
    .maybeSingle();
  if (!job?.provider_job_id || job.status !== "generating") {
    return { video_status: shot.video_status, video_url: shot.video_url, video_error: shot.video_error };
  }

  try {
    const result = await getVideoProvider().checkJob(job.provider_job_id);
    if (result.status === "ready") {
      await admin.rpc("finalize_shot_generation", {
        p_job_id: shot.active_job_id,
        p_webhook_request_id: null,
        p_status: "ready",
        p_video_url: result.videoUrl,
        p_error: null,
      });
      revalidatePath(`/dashboard/projects/${projectId}`);
      return { video_status: "ready", video_url: result.videoUrl, video_error: null };
    }
    if (result.status === "failed") {
      await admin.rpc("finalize_shot_generation", {
        p_job_id: shot.active_job_id,
        p_webhook_request_id: null,
        p_status: "failed",
        p_video_url: null,
        p_error: result.error,
      });
      revalidatePath(`/dashboard/projects/${projectId}`);
      return { video_status: "failed", video_url: null, video_error: result.error };
    }
  } catch (err) {
    console.error("shot status check failed", shotId, err);
  }
  return { video_status: shot.video_status, video_url: shot.video_url, video_error: shot.video_error };
}
