import "server-only";

const BASE_URL = "https://api.heygen.com";

function headers() {
  return {
    "X-Api-Key": process.env.HEYGEN_API_KEY!,
    "Content-Type": "application/json",
  };
}

export type PublicAvatar = {
  id: string;
  name: string;
  gender: string | null;
  preview_image_url: string | null;
  default_voice_id: string | null;
  supported_api_engines?: string[];
};

type HeygenVoice = {
  voice_id: string;
  gender: string;
  language: string;
};

let voiceCache: HeygenVoice[] | null = null;

// The avatar listing's own `default_voice_id` field is unreliable — HeyGen
// has returned ids for voices that then 400 as "not found" when rendering.
// GET /v3/voices is the real, renderable catalog, so we source voice ids
// from there instead and never trust an avatar look's claimed default.
async function listVoices(): Promise<HeygenVoice[]> {
  if (voiceCache) return voiceCache;
  const res = await fetch(`${BASE_URL}/v3/voices?limit=100`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = await res.json();
  voiceCache = (json.data as HeygenVoice[]) ?? [];
  return voiceCache;
}

export async function getDefaultVoiceId(
  gender: "male" | "female",
): Promise<string | null> {
  const voices = await listVoices();
  const match =
    voices.find((v) => v.gender === gender && v.language === "English") ??
    voices.find((v) => v.gender === gender);
  return match?.voice_id ?? null;
}

export async function listPublicAvatars(limit = 12): Promise<PublicAvatar[]> {
  const fetchLimit = Math.min(Math.max(limit * 2, 24), 50);
  const [res, femaleVoice, maleVoice] = await Promise.all([
    fetch(
      `${BASE_URL}/v3/avatars/looks?ownership=public&avatar_type=studio_avatar&limit=${fetchLimit}`,
      { headers: headers(), cache: "no-store" },
    ),
    getDefaultVoiceId("female"),
    getDefaultVoiceId("male"),
  ]);
  if (!res.ok) {
    throw new Error(`HeyGen avatar list failed: ${res.status}`);
  }
  const json = await res.json();
  const avatars = (json.data as PublicAvatar[])
    .filter((a) => a.preview_image_url)
    .map((a) => ({
      ...a,
      default_voice_id: a.gender === "male" ? maleVoice : femaleVoice,
    }));

  const female = avatars.filter((a) => a.gender === "female");
  const others = avatars.filter((a) => a.gender !== "female");
  return [...female, ...others].slice(0, limit);
}

export async function createAvatarVideo(input: {
  avatarId: string;
  voiceId: string;
  script: string;
  title: string;
  engine?: string | null;
}): Promise<{ videoId: string }> {
  const res = await fetch(`${BASE_URL}/v3/videos`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      type: "avatar",
      avatar_id: input.avatarId,
      voice_id: input.voiceId,
      script: input.script,
      title: input.title,
      resolution: "720p",
      aspect_ratio: "9:16",
      ...(input.engine ? { engine: { type: input.engine } } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HeyGen video creation failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  return { videoId: json.data.video_id as string };
}

export type VideoStatus = {
  status: "pending" | "waiting" | "processing" | "completed" | "failed";
  videoUrl: string | null;
  failureMessage: string | null;
};

export async function getVideoStatus(videoId: string): Promise<VideoStatus> {
  const res = await fetch(`${BASE_URL}/v3/videos/${videoId}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`HeyGen video status failed: ${res.status}`);
  }
  const json = await res.json();
  return {
    status: json.data.status,
    videoUrl: json.data.video_url ?? null,
    failureMessage: json.data.failure_message ?? null,
  };
}

export type DirectUploadInit = {
  assetId: string;
  uploadUrl: string;
  uploadHeaders: Record<string, string>;
};

// Vercel caps a function's request body at 4.5MB, so video footage can never
// pass through our server — the browser PUTs bytes straight to uploadUrl.
export async function initDirectUpload(input: {
  filename: string;
  contentType: string;
  sizeBytes: number;
}): Promise<DirectUploadInit> {
  const res = await fetch(`${BASE_URL}/v3/assets/direct-uploads`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      filename: input.filename,
      content_type: input.contentType,
      size_bytes: input.sizeBytes,
    }),
  });
  if (!res.ok) {
    throw new Error(`HeyGen upload init failed: ${res.status}`);
  }
  const json = await res.json();
  return {
    assetId: json.data.asset_id,
    uploadUrl: json.data.upload_url,
    uploadHeaders: json.data.upload_headers,
  };
}

export async function completeDirectUpload(assetId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/v3/assets/${assetId}/complete`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    throw new Error(`HeyGen upload finalize failed: ${res.status}`);
  }
}

export async function createDigitalTwin(input: {
  name: string;
  assetId: string;
}): Promise<{ groupId: string; lookId: string; voiceId: string | null }> {
  const res = await fetch(`${BASE_URL}/v3/avatars`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      type: "digital_twin",
      name: input.name,
      file: { type: "asset_id", asset_id: input.assetId },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HeyGen digital twin creation failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  return {
    groupId: json.data.avatar_group.id as string,
    lookId: json.data.avatar_item.id as string,
    voiceId: json.data.avatar_item.default_voice_id ?? null,
  };
}

export async function getAvatarLookStatus(lookId: string): Promise<{
  status: "processing" | "completed" | "failed";
  errorMessage: string | null;
}> {
  const res = await fetch(`${BASE_URL}/v3/avatars/looks/${lookId}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`HeyGen look status failed: ${res.status}`);
  }
  const json = await res.json();
  return {
    status: json.data.status,
    errorMessage: json.data.error?.message ?? null,
  };
}

export async function createPromptAvatar(input: {
  name: string;
  prompt: string;
}): Promise<{ groupId: string; lookId: string }> {
  const res = await fetch(`${BASE_URL}/v3/avatars`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      type: "prompt",
      name: input.name,
      prompt: input.prompt,
      aspect_ratio: "9:16",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HeyGen avatar generation failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  return {
    groupId: json.data.avatar_group.id as string,
    lookId: json.data.avatar_item.id as string,
  };
}

export async function getAvatarLookPreview(lookId: string): Promise<{
  previewImageUrl: string | null;
  supportedApiEngines: string[];
}> {
  const res = await fetch(`${BASE_URL}/v3/avatars/looks/${lookId}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) return { previewImageUrl: null, supportedApiEngines: [] };
  const json = await res.json();
  return {
    previewImageUrl: json.data.preview_image_url ?? null,
    supportedApiEngines: json.data.supported_api_engines ?? [],
  };
}

export async function requestAvatarConsent(
  groupId: string,
): Promise<{ consentUrl: string; consentStatus: string }> {
  const res = await fetch(`${BASE_URL}/v3/avatars/${groupId}/consent`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HeyGen consent request failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  return {
    consentUrl: json.data.url as string,
    consentStatus: json.data.avatar_group.consent_status as string,
  };
}

export async function getAvatarGroupConsentStatus(
  groupId: string,
): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/v3/avatars/${groupId}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`HeyGen group status failed: ${res.status}`);
  }
  const json = await res.json();
  return json.data.consent_status ?? null;
}

export function scriptToNarration(script: {
  hook: string;
  shots: { dialogue_or_voiceover: string }[];
  cta: string;
}): string {
  const lines = [
    script.hook,
    ...script.shots.map((s) => s.dialogue_or_voiceover).filter(Boolean),
    script.cta,
  ];
  return lines.join(" ");
}
