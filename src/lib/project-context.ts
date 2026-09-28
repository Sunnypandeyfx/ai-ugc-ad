import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Brief } from "@/lib/brief";
import type { ConfirmedFacts } from "@/lib/product";

export type ContextProject = {
  id: string;
  user_id: string;
  title: string;
  current_step: string;
  aspect_ratio: string;
  product_id: string | null;
  concept_rounds: number;
  storyboard_generations: number;
  selected_concept_id: string | null;
};

export type ProjectContext = {
  project: ContextProject;
  facts: ConfirmedFacts;
  factsConfirmedAt: string;
  brief: Brief;
  briefUpdatedAt: string;
};

// Everything the creative steps may use: the customer's confirmed product
// facts and their brief. AI analysis is deliberately not loaded here.
export async function loadProjectContext(
  userId: string,
  projectId: string,
): Promise<{ ctx: ProjectContext; error: null } | { ctx: null; error: string }> {
  const admin = createAdminClient();
  const { data: project } = await admin
    .from("projects")
    .select(
      "id, user_id, title, current_step, aspect_ratio, product_id, concept_rounds, storyboard_generations, selected_concept_id",
    )
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!project) return { ctx: null, error: "Project not found." };
  if (!project.product_id) return { ctx: null, error: "Confirm your product details first." };

  const [{ data: product }, { data: brief }] = await Promise.all([
    admin
      .from("products")
      .select("confirmed_facts, confirmed_at")
      .eq("id", project.product_id)
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("project_briefs")
      .select("objective, audience, platform, ad_style, tone, duration_seconds, cta, advanced, updated_at")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (!product?.confirmed_facts || !product.confirmed_at) {
    return { ctx: null, error: "Confirm your product details first." };
  }
  if (!brief) return { ctx: null, error: "Fill in the brief first." };

  const { updated_at: briefUpdatedAt, ...briefFields } = brief;
  return {
    ctx: {
      project,
      facts: product.confirmed_facts as ConfirmedFacts,
      factsConfirmedAt: product.confirmed_at,
      brief: briefFields as Brief,
      briefUpdatedAt,
    },
    error: null,
  };
}
