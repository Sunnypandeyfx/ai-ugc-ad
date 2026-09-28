export const SHOT_TYPES = [
  { value: "product", label: "Product shot" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "presenter", label: "Presenter" },
  { value: "text", label: "Text / end card" },
] as const;

export type ShotType = (typeof SHOT_TYPES)[number]["value"];

export function isShotType(value: string): value is ShotType {
  return SHOT_TYPES.some((t) => t.value === value);
}

export function shotTypeLabel(value: string): string {
  return SHOT_TYPES.find((t) => t.value === value)?.label ?? value;
}

// Most video models generate 5-10 second clips, so a shot never exceeds 10s.
export const SHOT_DURATION = { min: 1, max: 10 } as const;
export const MAX_SHOTS = 12;

export const SHOT_LIMITS = {
  scene: 600,
  camera: 200,
  on_screen_text: 120,
  voiceover: 400,
  sound: 200,
  cta: 160,
} as const;

export const MAX_CONCEPT_ROUNDS = 5;
export const MAX_STORYBOARD_GENERATIONS = 10;
export const AGENT_MESSAGES_PER_HOUR = 30;

export type Concept = {
  id: string;
  round: number;
  position: number;
  title: string;
  logline: string;
  hook: string;
  beats: string[];
  visual_style: string;
  rationale: string;
  facts_used: string[];
  created_at: string;
};

export type ShotFields = {
  shot_type: ShotType;
  duration_seconds: number;
  scene: string;
  camera: string;
  on_screen_text: string;
  voiceover: string;
  sound: string;
  facts_used: string[];
};

export type Shot = ShotFields & { id: string; position: number };

export type Storyboard = {
  concept_id: string | null;
  title: string;
  summary: string;
  cta: string;
  generated_at: string;
  approved_at: string | null;
  updated_at: string;
};

export function totalDuration(shots: { duration_seconds: number }[]): number {
  return shots.reduce((sum, s) => sum + s.duration_seconds, 0);
}

function clip(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

// Model and form output both pass through here before anything is saved.
// facts_used is filtered against the confirmed list so a shot can never
// claim to rely on a fact the customer didn't confirm.
export function cleanShot(raw: Partial<Record<keyof ShotFields, unknown>>, confirmedFacts: string[]): ShotFields | null {
  const scene = clip(raw.scene, SHOT_LIMITS.scene);
  if (!scene) return null;
  const type = typeof raw.shot_type === "string" && isShotType(raw.shot_type) ? raw.shot_type : "product";
  const duration = Math.round(Number(raw.duration_seconds));
  return {
    shot_type: type,
    duration_seconds: Number.isFinite(duration)
      ? Math.min(SHOT_DURATION.max, Math.max(SHOT_DURATION.min, duration))
      : 3,
    scene,
    camera: clip(raw.camera, SHOT_LIMITS.camera),
    on_screen_text: clip(raw.on_screen_text, SHOT_LIMITS.on_screen_text),
    voiceover: clip(raw.voiceover, SHOT_LIMITS.voiceover),
    sound: clip(raw.sound, SHOT_LIMITS.sound),
    facts_used: Array.isArray(raw.facts_used)
      ? raw.facts_used.filter((f): f is string => typeof f === "string" && confirmedFacts.includes(f))
      : [],
  };
}

// Nudge durations so a generated storyboard lands on the brief's length.
// Only used on model output; customer edits are never silently changed.
export function fitDurations(shots: ShotFields[], target: number): ShotFields[] {
  const result = shots.map((s) => ({ ...s }));
  let diff = target - totalDuration(result);
  for (let pass = 0; diff !== 0 && pass < 20; pass++) {
    for (let i = result.length - 1; i >= 0 && diff !== 0; i--) {
      const step = diff > 0 ? 1 : -1;
      const next = result[i].duration_seconds + step;
      if (next >= SHOT_DURATION.min && next <= SHOT_DURATION.max) {
        result[i].duration_seconds = next;
        diff -= step;
      }
    }
  }
  return result;
}
