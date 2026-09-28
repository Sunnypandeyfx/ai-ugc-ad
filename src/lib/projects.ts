export const STEPS = [
  { key: "product", label: "Product", blurb: "Upload your product and confirm its details." },
  { key: "brief", label: "Brief", blurb: "Objective, audience, platform, style and tone." },
  { key: "concept", label: "Concept", blurb: "Pick one of three distinct ad concepts." },
  { key: "storyboard", label: "Storyboard", blurb: "Review and approve every shot before anything is generated." },
  { key: "shots", label: "Shots", blurb: "Generate each shot individually and replace only the ones you don't like." },
  { key: "final", label: "Final", blurb: "Arrange shots, add captions, logo, music and voiceover." },
  { key: "export", label: "Export", blurb: "Render and download the finished commercial." },
] as const;

export type StepKey = (typeof STEPS)[number]["key"];

export function stepIndex(step: string): number {
  const i = STEPS.findIndex((s) => s.key === step);
  return i === -1 ? 0 : i;
}

export const PROJECT_STATUSES = [
  { key: "draft", label: "Drafts" },
  { key: "awaiting_approval", label: "Awaiting approval" },
  { key: "generating", label: "Generating" },
  { key: "completed", label: "Completed" },
  { key: "failed", label: "Failed" },
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]["key"];

export const ASPECT_RATIOS = ["9:16", "16:9", "1:1"] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export const ASPECT_RATIO_LABELS: Record<AspectRatio, string> = {
  "9:16": "9:16 — vertical (TikTok, Reels, Shorts)",
  "16:9": "16:9 — widescreen (YouTube, web)",
  "1:1": "1:1 — square (feed posts)",
};

export function statusLabel(status: string): string {
  if (status === "draft") return "Draft";
  return PROJECT_STATUSES.find((s) => s.key === status)?.label ?? status;
}
