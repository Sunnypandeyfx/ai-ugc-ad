type Option = { value: string; label: string };

export const OBJECTIVES: Option[] = [
  { value: "awareness", label: "Build awareness" },
  { value: "launch", label: "Launch a new product" },
  { value: "conversions", label: "Drive sales" },
  { value: "explain", label: "Explain how it works" },
  { value: "offer", label: "Promote an offer" },
  { value: "retargeting", label: "Win back past visitors" },
];

export const PLATFORMS: Option[] = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram_reels", label: "Instagram Reels" },
  { value: "youtube_shorts", label: "YouTube Shorts" },
  { value: "meta_feed", label: "Facebook / Instagram feed" },
  { value: "youtube", label: "YouTube (in-stream)" },
  { value: "website", label: "Website or landing page" },
];

export const AD_STYLES: Option[] = [
  { value: "cinematic", label: "Cinematic commercial" },
  { value: "product_demo", label: "Product demo" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "ugc", label: "UGC-style creator" },
];

export const TONES: Option[] = [
  { value: "premium", label: "Premium" },
  { value: "bold", label: "Bold and energetic" },
  { value: "playful", label: "Playful" },
  { value: "calm", label: "Calm and minimal" },
  { value: "warm", label: "Warm and friendly" },
  { value: "emotional", label: "Emotional" },
];

export const DURATIONS = [15, 30, 45, 60] as const;

export const MUSIC_MOODS: Option[] = [
  { value: "", label: "Let Backlot choose" },
  { value: "upbeat", label: "Upbeat" },
  { value: "cinematic", label: "Cinematic" },
  { value: "ambient", label: "Ambient" },
  { value: "none", label: "No music" },
];

export const VOICEOVERS: Option[] = [
  { value: "", label: "Let Backlot choose" },
  { value: "female", label: "Female voice" },
  { value: "male", label: "Male voice" },
  { value: "none", label: "No voiceover" },
];

export const LANGUAGES: Option[] = [
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Portuguese", label: "Portuguese" },
  { value: "Hindi", label: "Hindi" },
];

export type BriefAdvanced = {
  key_message?: string;
  offer?: string;
  must_include?: string;
  must_avoid?: string;
  visual_direction?: string;
  brand_colors?: string;
  music?: string;
  voiceover?: string;
  language?: string;
  captions?: boolean;
};

export type Brief = {
  objective: string;
  audience: string;
  platform: string;
  ad_style: string;
  tone: string;
  duration_seconds: number;
  cta: string | null;
  advanced: BriefAdvanced;
};

export function isOption(options: Option[], value: string): boolean {
  return options.some((o) => o.value === value);
}

export function optionLabel(options: Option[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
