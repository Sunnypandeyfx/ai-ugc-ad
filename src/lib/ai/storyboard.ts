import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { AD_RULES, describeProject } from "@/lib/ai/adRules";
import { asArray, asObject, unwrapToolInput } from "@/lib/ai/toolInput";
import type { ProjectContext } from "@/lib/project-context";
import {
  MAX_SHOTS,
  SHOT_DURATION,
  SHOT_LIMITS,
  cleanShot,
  fitDurations,
  type Concept,
  type ShotFields,
} from "@/lib/storyboard";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const SHOT_PROPERTIES = {
  shot_type: {
    type: "string",
    enum: ["product", "lifestyle", "presenter", "text"],
    description:
      "product = the product itself on camera; lifestyle = people/setting with the product; presenter = an AI presenter speaking to camera; text = typographic or end card.",
  },
  duration_seconds: {
    type: "integer",
    minimum: SHOT_DURATION.min,
    maximum: SHOT_DURATION.max,
  },
  scene: {
    type: "string",
    description: "What is on screen, concretely enough to generate the shot: subject, setting, action, light.",
  },
  camera: { type: "string", description: "Framing and movement, e.g. 'Slow push-in, macro'." },
  on_screen_text: { type: "string", description: "Short overlay text, or empty string." },
  voiceover: { type: "string", description: "Spoken line for this shot, or empty string." },
  sound: { type: "string", description: "Music or sound design cue, or empty string." },
  facts_used: {
    type: "array",
    items: { type: "string" },
    description: "Confirmed facts this shot states or shows, copied exactly from the confirmed facts list.",
  },
} as const;

const STORYBOARD_TOOL: Anthropic.Tool = {
  name: "submit_storyboard",
  description: "Submit the storyboard for the chosen concept.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      summary: { type: "string", description: "One or two sentences summarizing the ad." },
      shots: {
        type: "array",
        minItems: 2,
        maxItems: MAX_SHOTS,
        items: {
          type: "object",
          properties: SHOT_PROPERTIES,
          required: ["shot_type", "duration_seconds", "scene", "camera", "on_screen_text", "voiceover", "sound", "facts_used"],
        },
      },
    },
    required: ["title", "summary", "shots"],
  },
};

export type StoryboardDraft = { title: string; summary: string; cta: string; shots: ShotFields[] };

export async function writeStoryboard(ctx: ProjectContext, concept: Concept): Promise<StoryboardDraft> {
  const language = ctx.brief.advanced?.language ?? "English";
  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4000,
    system: AD_RULES,
    tools: [STORYBOARD_TOOL],
    tool_choice: { type: "tool", name: "submit_storyboard" },
    messages: [
      {
        role: "user",
        content: `${describeProject(ctx.facts, ctx.brief, ctx.project.aspect_ratio)}

<chosen_concept>
Title: ${concept.title}
Logline: ${concept.logline}
Hook: ${concept.hook}
Beats:
${concept.beats.map((b) => `- ${b}`).join("\n")}
Visual style: ${concept.visual_style}
</chosen_concept>

Turn the chosen concept into a shot-by-shot storyboard.
- Shot durations must add up to exactly ${ctx.brief.duration_seconds} seconds; each shot is ${SHOT_DURATION.min}-${SHOT_DURATION.max} seconds.
- Every shot must be something a video model can generate on its own from the scene description.
- Write voiceover and on-screen text in ${language}; write everything else in English.
- Keep on-screen text short and voiceover paced for its shot length.`,
      },
    ],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) throw new Error("Claude did not return a storyboard.");

  const raw = unwrapToolInput(toolUse.input, "shots");
  const shots = asArray(raw.shots)
    .map((s) => cleanShot({ ...asObject(s), facts_used: asArray(asObject(s).facts_used) }, ctx.facts.facts))
    .filter((s): s is ShotFields => s !== null)
    .slice(0, MAX_SHOTS);
  if (shots.length < 2) throw new Error("Claude returned an incomplete storyboard.");

  const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  return {
    title: text(raw.title, 120) || concept.title,
    summary: text(raw.summary, 400),
    cta: (ctx.brief.cta ?? "").slice(0, SHOT_LIMITS.cta),
    shots: fitDurations(shots, ctx.brief.duration_seconds),
  };
}
