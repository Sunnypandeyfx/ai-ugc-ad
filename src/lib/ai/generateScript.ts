import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type AdScript = {
  hook: string;
  concept_summary: string;
  shots: {
    shot_number: number;
    description: string;
    dialogue_or_voiceover: string;
    duration_seconds: number;
  }[];
  on_screen_captions: string[];
  cta: string;
};

const SCRIPT_TOOL: Anthropic.Tool = {
  name: "submit_ad_script",
  description: "Submit the finished ad script and shot list.",
  input_schema: {
    type: "object",
    properties: {
      hook: {
        type: "string",
        description: "The opening line/moment, first 1-2 seconds, that stops the scroll.",
      },
      concept_summary: {
        type: "string",
        description: "One or two sentences describing the overall creative concept.",
      },
      shots: {
        type: "array",
        items: {
          type: "object",
          properties: {
            shot_number: { type: "integer" },
            description: {
              type: "string",
              description: "What the camera/creator/scene shows in this shot.",
            },
            dialogue_or_voiceover: {
              type: "string",
              description: "Spoken line for this shot, empty string if none.",
            },
            duration_seconds: { type: "integer" },
          },
          required: ["shot_number", "description", "dialogue_or_voiceover", "duration_seconds"],
        },
      },
      on_screen_captions: {
        type: "array",
        items: { type: "string" },
        description: "Short on-screen text overlays to reinforce key moments.",
      },
      cta: {
        type: "string",
        description: "The closing call to action line.",
      },
    },
    required: ["hook", "concept_summary", "shots", "on_screen_captions", "cta"],
  },
};

export async function generateAdScript(input: {
  productName: string;
  productDescription: string;
  adType: "ugc" | "cinematic";
  audience: string;
  platform: string;
  tone?: string;
  durationSeconds: number;
}): Promise<AdScript> {
  const styleGuidance =
    input.adType === "ugc"
      ? `Write this as an authentic UGC-style testimonial: one creator speaking directly to camera, casual and specific, not polished ad-speak. Exactly ${input.durationSeconds} seconds total.`
      : `Write this as a cinematic, dialogue-light brand commercial: visual, produced scenes showing the product, minimal or no spoken dialogue, voiceover only where it earns its place. Exactly ${input.durationSeconds} seconds total.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1500,
    tools: [SCRIPT_TOOL],
    tool_choice: { type: "tool", name: "submit_ad_script" },
    messages: [
      {
        role: "user",
        content: `Write a short-form video ad script for this product.

Product name: ${input.productName}
Product description: ${input.productDescription}
Target audience: ${input.audience}
Platform: ${input.platform}
Tone: ${input.tone || "confident and natural, not salesy"}

${styleGuidance}

Break it into shots with realistic durations that add up to the total runtime.`,
      },
    ],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );

  if (!toolUse) {
    throw new Error("Claude did not return a structured script.");
  }

  return toolUse.input as AdScript;
}
