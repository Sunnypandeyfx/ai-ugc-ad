"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentUserId } from "@/lib/projects-server";
import { loadProjectContext } from "@/lib/project-context";
import { loadShots, markStoryboardEdited, saveShots } from "@/lib/storyboard-server";
import { runStoryboardAgent, type AgentTurn } from "@/lib/ai/agent";
import { AGENT_MESSAGES_PER_HOUR } from "@/lib/storyboard";

export type AgentState = { error: string | null };

const MAX_MESSAGE = 1000;
const HISTORY_TURNS = 12;

export async function sendAgentMessage(
  projectId: string,
  _prev: AgentState,
  formData: FormData,
): Promise<AgentState> {
  const userId = await currentUserId();
  if (!userId) return { error: "Not signed in." };
  const message = String(formData.get("message") || "").trim();
  if (!message) return { error: null };
  if (message.length > MAX_MESSAGE) return { error: `Keep messages under ${MAX_MESSAGE} characters.` };

  const { ctx, error } = await loadProjectContext(userId, projectId);
  if (!ctx) return { error };
  const shots = await loadShots(userId, projectId);
  if (shots.length === 0) return { error: "Write a storyboard first." };

  const admin = createAdminClient();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("project_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", hourAgo);
  if ((count ?? 0) >= AGENT_MESSAGES_PER_HOUR) {
    return { error: "You've sent a lot of messages in the last hour. Please wait a bit and try again." };
  }

  const { data: recent } = await admin
    .from("project_messages")
    .select("role, content")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_TURNS);
  const history = ((recent ?? []) as AgentTurn[]).reverse();

  let result;
  try {
    result = await runStoryboardAgent({ ctx, shots, history, message });
  } catch (err) {
    console.error("project agent failed", projectId, err);
    return { error: "The assistant couldn't respond. Please try again." };
  }

  if (result.changes.length > 0) {
    await saveShots(userId, projectId, result.shots);
    await markStoryboardEdited(userId, projectId);
  }

  // Both turns are stored together so the history always alternates.
  const now = Date.now();
  const { error: logError } = await admin.from("project_messages").insert([
    {
      project_id: projectId,
      user_id: userId,
      role: "user",
      content: message,
      changes: [],
      created_at: new Date(now).toISOString(),
    },
    {
      project_id: projectId,
      user_id: userId,
      role: "assistant",
      content: result.reply.slice(0, 4000),
      changes: result.changes,
      created_at: new Date(now + 1).toISOString(),
    },
  ]);
  if (logError) console.error("project agent log failed", projectId, logError);

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { error: null };
}
