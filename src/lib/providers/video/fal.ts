import "server-only";
import type {
  ProviderJobResult,
  SubmitImageToVideoInput,
  SubmitImageToVideoResult,
  VideoProvider,
} from "./types";

// fal.ai (https://fal.ai) is an aggregator: one API key calls many
// underlying models behind a consistent queue-based REST shape. We default
// to Google's Veo 3.1 because its docs are directly verifiable and it
// natively supports image-to-video, but the model id below is the only
// thing that would change to switch to a different fal-hosted model
// (e.g. "fal-ai/kling-video/v2.5-turbo/pro/image-to-video").
//
// Verified against fal's own docs on 2026-09-29:
//   - auth: `Authorization: Key <FAL_KEY>` (fal.ai/docs/authentication)
//   - queue endpoints: POST https://queue.fal.run/{model}
//                       GET  https://queue.fal.run/{model}/requests/{id}/status
//                       GET  https://queue.fal.run/{model}/requests/{id}
//   - fal-ai/veo3.1/image-to-video input schema: prompt, image_url,
//     aspect_ratio (auto|16:9|9:16), resolution (720p|1080p|4k),
//     duration ("4s"|"6s"|"8s"), generate_audio (bool)
//   - output schema: { video: { url } }
const MODEL_ID = "fal-ai/veo3.1/image-to-video";
const QUEUE_BASE = `https://queue.fal.run/${MODEL_ID}`;

function apiKey(): string {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("FAL_KEY is not configured.");
  return key;
}

function headers() {
  return { Authorization: `Key ${apiKey()}`, "Content-Type": "application/json" };
}

// Veo 3.1 only accepts these three discrete lengths. We round to the
// nearest one, so a generated clip's actual length can differ slightly
// from the shot's planned duration until the assembly step trims it.
function nearestSupportedDuration(seconds: number): "4s" | "6s" | "8s" {
  const options: [number, "4s" | "6s" | "8s"][] = [
    [4, "4s"],
    [6, "6s"],
    [8, "8s"],
  ];
  return options.reduce((best, cur) =>
    Math.abs(cur[0] - seconds) < Math.abs(best[0] - seconds) ? cur : best,
  )[1];
}

// fal's Veo 3.1 endpoint only accepts 16:9, 9:16 or auto — there is no
// square option, so 1:1 projects fall back to auto framing.
function mapAspectRatio(ratio: "9:16" | "16:9" | "1:1"): "16:9" | "9:16" | "auto" {
  return ratio === "1:1" ? "auto" : ratio;
}

type FalSubmitResponse = { request_id: string };
type FalStatusResponse = {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | string;
  error?: string;
};
type FalResultResponse = { video?: { url?: string }; error?: string };

async function falFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { ...headers(), ...(init?.headers ?? {}) } });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`fal.ai request failed (${res.status}): ${text.slice(0, 300)}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("fal.ai returned an unreadable response.");
  }
}

export const falVideoProvider: VideoProvider = {
  name: "fal",

  // Flat 1 credit per shot: at 720p without audio, fal prices Veo 3.1 at
  // $0.20/sec, so even an 8s clip ($1.60) leaves healthy margin against a
  // ~$4.90/credit plan price. Kept as a function so a future model or
  // duration-based price can change this without touching call sites.
  estimateCredits() {
    return 1;
  },

  async submitImageToVideo(input: SubmitImageToVideoInput): Promise<SubmitImageToVideoResult> {
    const url = input.webhookUrl
      ? `${QUEUE_BASE}?fal_webhook=${encodeURIComponent(input.webhookUrl)}`
      : QUEUE_BASE;
    const body = {
      prompt: input.prompt.slice(0, 4000),
      image_url: input.imageUrl,
      aspect_ratio: mapAspectRatio(input.aspectRatio),
      resolution: "720p",
      duration: nearestSupportedDuration(input.durationSeconds),
      generate_audio: false,
    };
    const result = await falFetch<FalSubmitResponse>(url, {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!result.request_id) throw new Error("fal.ai did not return a request id.");
    return { providerJobId: result.request_id };
  },

  async checkJob(providerJobId: string): Promise<ProviderJobResult> {
    const status = await falFetch<FalStatusResponse>(
      `${QUEUE_BASE}/requests/${providerJobId}/status`,
    );

    if (status.status === "IN_QUEUE") return { status: "queued" };
    if (status.status === "IN_PROGRESS") return { status: "generating" };

    if (status.status !== "COMPLETED") {
      // Unrecognized status: treat as still working rather than guessing failure.
      return { status: "generating" };
    }

    if (status.error) return { status: "failed", error: status.error.slice(0, 500) };

    const result = await falFetch<FalResultResponse>(`${QUEUE_BASE}/requests/${providerJobId}`);
    if (result.error) return { status: "failed", error: result.error.slice(0, 500) };
    if (!result.video?.url) return { status: "failed", error: "fal.ai returned no video." };
    return { status: "ready", videoUrl: result.video.url };
  },
};
