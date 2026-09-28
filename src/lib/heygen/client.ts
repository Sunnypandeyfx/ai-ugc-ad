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
};

export async function listPublicAvatars(limit = 12): Promise<PublicAvatar[]> {
  const res = await fetch(
    `${BASE_URL}/v3/avatars/looks?ownership=public&limit=${limit}`,
    { headers: headers(), cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error(`HeyGen avatar list failed: ${res.status}`);
  }
  const json = await res.json();
  return (json.data as PublicAvatar[]).filter((a) => a.preview_image_url);
}

export async function createAvatarVideo(input: {
  avatarId: string;
  voiceId: string;
  script: string;
  title: string;
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
