import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { AD_RULES, describeProject } from "@/lib/ai/adRules";
import { asArray, asObject, unwrapToolInput } from "@/lib/ai/toolInput";
import type { ProjectContext } from "@/lib/project-context";
import type { Concept } from "@/lib/storyboard";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type ConceptDraft = Omit<Concept, "id" | "round" | "position" | "created_at">;

const CONCEPTS_TOOL: Anthropic.Tool = {
  name: "submit_concepts",
  description: "Submit exactly three distinct ad concepts.",
  input_schema: {
    type: "object",
    properties: {
      concepts: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Short, memorable concept name (2-5 words)." },
            logline: { type: "string", description: "One sentence: what the ad is." },
            hook: { type: "string", description: "What happens or is said in the first 2 seconds." },
            beats: {
              type: "array",
              items: { type: "string" },
              description: "3-5 short beats describing how the ad unfolds, in order.",
            },
            visual_style: { type: "string", description: "Look and feel: setting, light, pacing, camera." },
            rationale: { type: "string", description: "One sentence on why this fits the audience and objective." },
            facts_used: {
              type: "array",
              items: { type: "string" },
              description: "The confirmed facts this concept relies on, copied exactly from the confirmed facts list.",
            },
          },
          required: ["title", "logline", "hook", "beats", "visual_style", "rationale", "facts_used"],
        },
      },
    },
    required: ["concepts"],
  },
};

export async function writeConcepts(ctx: ProjectContext, previousTitles: string[]): Promise<ConceptDraft[]> {
  const avoid = previousTitles.length
    ? `\n\nThe customer has already seen these concepts and wants new directions — do not repeat them: ${previousTitles.join("; ")}.`
    : "";

  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 3000,
    system: AD_RULES,
    tools: [CONCEPTS_TOOL],
    tool_choice: { type: "tool", name: "submit_concepts" },
    messages: [
      {
        role: "user",
        content: `${describeProject(ctx.facts, ctx.brief, ctx.project.aspect_ratio)}

Write three genuinely different concepts for this ${ctx.brief.duration_seconds}-second ad. Make them differ in angle (e.g. problem/solution, sensory product showcase, lifestyle moment, demonstration, bold typographic), not just in wording. Each must be producible as a short sequence of shots and match the requested ad style and tone.${avoid}`,
      },
    ],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) throw new Error("Claude did not return concepts.");

  const raw = asArray(unwrapToolInput(toolUse.input, "concepts").concepts);
  const confirmed = ctx.facts.facts;
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const concepts = raw
    .map(asObject)
    .map((c) => ({
      title: text(c.title, 80),
      logline: text(c.logline, 300),
      hook: text(c.hook, 300),
      beats: asArray(c.beats).map((b) => text(b, 240)).filter(Boolean).slice(0, 6),
      visual_style: text(c.visual_style, 300),
      rationale: text(c.rationale, 300),
      facts_used: asArray(c.facts_used).filter((f): f is string => typeof f === "string" && confirmed.includes(f)),
    }))
    .filter((c) => c.title && c.logline && c.hook)
    .slice(0, 3);

  if (concepts.length < 3) throw new Error("Claude returned incomplete concepts.");
  return concepts;
}
