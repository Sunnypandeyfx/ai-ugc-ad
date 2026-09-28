import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  MAX_SHOTS,
  MAX_STORYBOARD_GENERATIONS,
  totalDuration,
  type Shot,
  type Storyboard,
} from "@/lib/storyboard";
import ShotCard from "./ShotCard";
import { AddShot, ApproveButton, RegenerateButton } from "./StoryboardControls";

export default async function StoryboardStep({ projectId }: { projectId: string }) {
  const supabase = await createClient();
  const [{ data: project }, { data: board }, { data: shotRows }, { data: brief }] = await Promise.all([
    supabase.from("projects").select("product_id, storyboard_generations").eq("id", projectId).single(),
    supabase
      .from("project_storyboards")
      .select("concept_id, title, summary, cta, generated_at, approved_at, updated_at")
      .eq("project_id", projectId)
      .maybeSingle(),
    supabase
      .from("storyboard_shots")
      .select("id, position, shot_type, duration_seconds, scene, camera, on_screen_text, voiceover, sound, facts_used")
      .eq("project_id", projectId)
      .order("position"),
    supabase.from("project_briefs").select("duration_seconds, updated_at").eq("project_id", projectId).maybeSingle(),
  ]);

  if (!board || !project) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-border-strong p-6 text-sm text-fg-muted">
        No storyboard yet.{" "}
        <Link href={`/dashboard/projects/${projectId}?step=concept`} className="text-fg underline underline-offset-4">
          Choose a concept
        </Link>{" "}
        to write one.
      </div>
    );
  }

  const storyboard = board as Storyboard;
  const shots = (shotRows ?? []) as Shot[];
  const { data: product } = await supabase
    .from("products")
    .select("confirmed_at")
    .eq("id", project.product_id ?? "")
    .maybeSingle();

  const total = totalDuration(shots);
  const target = brief?.duration_seconds ?? total;
  const matches = total === target;
  const approved = Boolean(storyboard.approved_at);
  const generatedAt = new Date(storyboard.generated_at).getTime();
  const stale = [product?.confirmed_at, brief?.updated_at].some((t) => t && new Date(t).getTime() > generatedAt);
  const starts = shots.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + shots[i - 1].duration_seconds], []);

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display text-xl tracking-tight">{storyboard.title}</h3>
          {storyboard.summary && <p className="mt-1 max-w-xl text-sm text-fg-muted">{storyboard.summary}</p>}
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          {approved ? (
            <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
              Approved
            </span>
          ) : (
            <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-amber-300">
              Needs your approval
            </span>
          )}
          <span className={`text-xs ${matches ? "text-fg-subtle" : "text-amber-300"}`}>
            {total}s of {target}s · {shots.length} {shots.length === 1 ? "shot" : "shots"}
          </span>
        </div>
      </div>

      {stale && (
        <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          Your product details or brief changed after this storyboard was written. Check the shots still match, or
          rewrite the storyboard.
        </p>
      )}

      <ol className="space-y-3">
        {shots.map((shot, i) => (
          <ShotCard
            key={shot.id}
            projectId={projectId}
            shot={shot}
            number={i + 1}
            startsAt={starts[i]}
            isFirst={i === 0}
            isLast={i === shots.length - 1}
          />
        ))}
      </ol>

      <AddShot projectId={projectId} disabled={shots.length >= MAX_SHOTS} />

      {storyboard.cta && (
        <div className="rounded-xl border border-border p-4 text-sm">
          <p className="text-xs text-fg-subtle">Call to action (from your brief)</p>
          <p className="mt-1 text-fg">{storyboard.cta}</p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-bg-elevated p-5">
        {approved ? (
          <>
            <p className="text-sm text-fg">Storyboard approved.</p>
            <p className="mt-1 text-xs leading-relaxed text-fg-muted">
              Shot generation arrives in the next update — you&rsquo;ll see the credit cost of every shot and confirm
              before anything is generated. Editing a shot withdraws this approval.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-fg">Review every shot, then approve.</p>
            <p className="mt-1 text-xs leading-relaxed text-fg-muted">
              Nothing is generated until you approve. {!matches &&
                `Your shots add up to ${total}s — adjust them to ${target}s first.`}
            </p>
            <div className="mt-4">
              <ApproveButton projectId={projectId} ready={matches && shots.length > 0} />
            </div>
          </>
        )}
      </div>

      <RegenerateButton
        projectId={projectId}
        left={MAX_STORYBOARD_GENERATIONS - project.storyboard_generations}
      />
    </div>
  );
}
