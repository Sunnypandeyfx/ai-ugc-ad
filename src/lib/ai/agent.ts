import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { AD_RULES, describeProject } from "@/lib/ai/adRules";
import { SHOT_PROPERTIES } from "@/lib/ai/storyboard";
import { asArray, asObject } from "@/lib/ai/toolInput";
import type { ProjectContext } from "@/lib/project-context";
import {
  MAX_SHOTS,
  cleanShot,
  shotTypeLabel,
  totalDuration,
  type Shot,
  type ShotFields,
} from "@/lib/storyboard";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type WorkingShot = ShotFields & { id?: string };
export type AgentTurn = { role: "user" | "assistant"; content: string };
export type AgentResult = { reply: string; shots: WorkingShot[]; changes: string[] };

const optionalShot = { type: "object" as const, properties: SHOT_PROPERTIES };

const TOOLS: Anthropic.Tool[] = [
  {
    name: "update_shot",
    description: "Change one or more fields of an existing shot. Only include the fields that change.",
    input_schema: {
      type: "object",
      properties: {
        shot_number: { type: "integer", description: "1-based shot number as currently ordered." },
        changes: optionalShot,
      },
      required: ["shot_number", "changes"],
    },
  },
  {
    name: "add_shot",
    description: "Insert a new shot after the given shot number (0 inserts at the start).",
    input_schema: {
      type: "object",
      properties: {
        after_shot_number: { type: "integer" },
        shot: {
          ...optionalShot,
          required: ["shot_type", "duration_seconds", "scene", "camera", "on_screen_text", "voiceover", "sound", "facts_used"],
        },
      },
      required: ["after_shot_number", "shot"],
    },
  },
  {
    name: "remove_shot",
    description: "Delete a shot.",
    input_schema: {
      type: "object",
      properties: { shot_number: { type: "integer" } },
      required: ["shot_number"],
    },
  },
  {
    name: "move_shot",
    description: "Move a shot to a new position (1-based).",
    input_schema: {
      type: "object",
      properties: { shot_number: { type: "integer" }, to_position: { type: "integer" } },
      required: ["shot_number", "to_position"],
    },
  },
];

function renderStoryboard(shots: WorkingShot[], target: number): string {
  const lines = shots.map(
    (s, i) =>
      `Shot ${i + 1} (${shotTypeLabel(s.shot_type)}, ${s.duration_seconds}s)\n  Scene: ${s.scene}\n  Camera: ${s.camera || "-"}\n  On-screen text: ${s.on_screen_text || "-"}\n  Voiceover: ${s.voiceover || "-"}\n  Sound: ${s.sound || "-"}\n  Facts used: ${s.facts_used.join("; ") || "-"}`,
  );
  return `<current_storyboard total="${totalDuration(shots)}s" target="${target}s">\n${lines.join("\n")}\n</current_storyboard>`;
}

export async function runStoryboardAgent(input: {
  ctx: ProjectContext;
  shots: Shot[];
  history: AgentTurn[];
  message: string;
}): Promise<AgentResult> {
  const { ctx } = input;
  const target = ctx.brief.duration_seconds;
  const confirmed = ctx.facts.facts;
  let shots: WorkingShot[] = input.shots.map((s) => ({
    id: s.id,
    shot_type: s.shot_type,
    duration_seconds: s.duration_seconds,
    scene: s.scene,
    camera: s.camera,
    on_screen_text: s.on_screen_text,
    voiceover: s.voiceover,
    sound: s.sound,
    facts_used: s.facts_used,
  }));
  const changes: string[] = [];

  const system = `${AD_RULES}

You are also the project assistant for this ad. The customer is looking at the storyboard and asks you for changes.
- Make only the changes they ask for, using the tools. Shot numbers refer to the current order and shift after adds, removes and moves.
- Keep the total at ${target} seconds (each shot 1-10s) unless they ask otherwise. If a change breaks the total, rebalance neighbouring shots and say so.
- If they ask you to add a claim that isn't in <confirmed_product> (e.g. results, ingredients, awards, discounts), don't add it. Explain briefly that they can add it as a confirmed fact in the Product step if it's true.
- If they ask something that isn't a storyboard change, answer briefly without tools.
- After making changes, reply in one to three short sentences describing what you changed. No markdown headings.

${describeProject(ctx.facts, ctx.brief, ctx.project.aspect_ratio)}`;

  const messages: Anthropic.MessageParam[] = [
    ...input.history.map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: `${renderStoryboard(shots, target)}\n\n<customer_message>\n${input.message}\n</customer_message>` },
  ];

  const shotArg = (value: unknown) => {
    const fields = asObject(value);
    if ("facts_used" in fields) fields.facts_used = asArray(fields.facts_used);
    return fields;
  };

  const apply = (name: string, args: Record<string, unknown>): string => {
    const n = Number(args.shot_number);
    const index = n - 1;
    switch (name) {
      case "update_shot": {
        if (!shots[index]) return `Error: there is no shot ${n}.`;
        const merged = cleanShot({ ...shots[index], ...shotArg(args.changes) }, confirmed);
        if (!merged) return "Error: a shot needs a scene description.";
        shots = shots.map((s, i) => (i === index ? { ...merged, id: s.id } : s));
        changes.push(`Edited shot ${n}`);
        return `Updated shot ${n}. Total is now ${totalDuration(shots)}s.`;
      }
      case "add_shot": {
        if (shots.length >= MAX_SHOTS) return `Error: the storyboard already has the maximum of ${MAX_SHOTS} shots.`;
        const after = Math.min(Math.max(Number(args.after_shot_number) || 0, 0), shots.length);
        const shot = cleanShot(shotArg(args.shot), confirmed);
        if (!shot) return "Error: a shot needs a scene description.";
        shots = [...shots.slice(0, after), shot, ...shots.slice(after)];
        changes.push(`Added shot ${after + 1}`);
        return `Added a shot at position ${after + 1}. Total is now ${totalDuration(shots)}s.`;
      }
      case "remove_shot": {
        if (!shots[index]) return `Error: there is no shot ${n}.`;
        if (shots.length <= 1) return "Error: the storyboard needs at least one shot.";
        shots = shots.filter((_, i) => i !== index);
        changes.push(`Removed shot ${n}`);
        return `Removed shot ${n}. Total is now ${totalDuration(shots)}s.`;
      }
      case "move_shot": {
        if (!shots[index]) return `Error: there is no shot ${n}.`;
        const to = Math.min(Math.max(Number(args.to_position) || 1, 1), shots.length) - 1;
        const next = [...shots];
        const [moved] = next.splice(index, 1);
        next.splice(to, 0, moved);
        shots = next;
        changes.push(`Moved shot ${n} to position ${to + 1}`);
        return `Moved shot ${n} to position ${to + 1}.`;
      }
      default:
        return "Error: unknown tool.";
    }
  };

  for (let turn = 0; turn < 6; turn++) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 2000,
      system,
      tools: TOOLS,
      messages,
    });

    const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
      const reply = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return { reply: reply || "Done.", shots, changes };
    }

    messages.push({ role: "assistant", content: response.content });
    messages.push({
      role: "user",
      content: toolUses.map((use) => ({
        type: "tool_result" as const,
        tool_use_id: use.id,
        content: apply(use.name, use.input as Record<string, unknown>),
      })),
    });
  }

  return {
    reply: changes.length ? "I made the changes listed below." : "Sorry — I couldn't finish that. Try asking in a simpler way.",
    shots,
    changes,
  };
}
