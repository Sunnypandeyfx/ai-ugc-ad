import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MAX_CONCEPT_ROUNDS, type Concept } from "@/lib/storyboard";
import { ChooseConceptButton, GenerateConceptsButton } from "./ConceptButtons";

export default async function ConceptStep({ projectId }: { projectId: string }) {
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("concept_rounds, selected_concept_id, product_id")
    .eq("id", projectId)
    .single();
  if (!project) return null;

  const [{ data: concepts }, { data: storyboard }, { data: product }, { data: brief }] = await Promise.all([
    supabase
      .from("project_concepts")
      .select("id, round, position, title, logline, hook, beats, visual_style, rationale, facts_used, created_at")
      .eq("project_id", projectId)
      .eq("round", project.concept_rounds)
      .order("position"),
    supabase.from("project_storyboards").select("concept_id").eq("project_id", projectId).maybeSingle(),
    supabase.from("products").select("confirmed_at").eq("id", project.product_id ?? "").maybeSingle(),
    supabase.from("project_briefs").select("updated_at").eq("project_id", projectId).maybeSingle(),
  ]);

  const list = (concepts ?? []) as Concept[];
  const roundsLeft = MAX_CONCEPT_ROUNDS - project.concept_rounds;
  const writtenAt = list[0] ? new Date(list[0].created_at).getTime() : 0;
  const stale =
    list.length > 0 &&
    [product?.confirmed_at, brief?.updated_at].some((t) => t && new Date(t).getTime() > writtenAt);

  if (list.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-bg-elevated p-6">
        <h3 className="text-sm font-medium">Three directions, one pick</h3>
        <p className="mt-1 max-w-lg text-xs leading-relaxed text-fg-muted">
          Claude writes three genuinely different ad concepts using only your confirmed product facts and your
          brief. Writing concepts doesn&rsquo;t use any credits.
        </p>
        <div className="mt-5">
          <GenerateConceptsButton projectId={projectId} label="Write 3 concepts" roundsLeft={roundsLeft} primary />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-5">
      {stale && (
        <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          Your product details or brief changed after these concepts were written. Write new concepts to use the
          latest version.
        </p>
      )}

      {list.map((concept) => {
        const selected = concept.id === project.selected_concept_id;
        return (
          <article
            key={concept.id}
            className={`rounded-xl border p-5 md:p-6 ${
              selected ? "border-accent/60 bg-accent/[0.04]" : "border-border bg-bg-elevated"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-wide text-fg-subtle">Concept {concept.position}</p>
              {selected && (
                <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-accent">
                  Selected
                </span>
              )}
            </div>
            <h3 className="mt-1 font-display text-xl tracking-tight">{concept.title}</h3>
            <p className="mt-2 text-sm text-fg-muted">{concept.logline}</p>

            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-xs text-fg-subtle">Hook</dt>
                <dd className="mt-1 text-fg">{concept.hook}</dd>
              </div>
              <div>
                <dt className="text-xs text-fg-subtle">How it plays</dt>
                <dd className="mt-1">
                  <ol className="list-decimal space-y-1 pl-5 text-fg-muted marker:text-fg-subtle">
                    {concept.beats.map((beat, i) => (
                      <li key={i}>{beat}</li>
                    ))}
                  </ol>
                </dd>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-fg-subtle">Look and feel</dt>
                  <dd className="mt-1 text-fg-muted">{concept.visual_style}</dd>
                </div>
                <div>
                  <dt className="text-xs text-fg-subtle">Why it works</dt>
                  <dd className="mt-1 text-fg-muted">{concept.rationale}</dd>
                </div>
              </div>
              <div>
                <dt className="text-xs text-fg-subtle">Confirmed facts it uses</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {concept.facts_used.length === 0 ? (
                    <span className="text-xs text-fg-muted">None — it relies on visuals and your description.</span>
                  ) : (
                    concept.facts_used.map((fact) => (
                      <span key={fact} className="rounded-full border border-border-strong px-2.5 py-1 text-[11px] text-fg-muted">
                        {fact}
                      </span>
                    ))
                  )}
                </dd>
              </div>
            </dl>

            <div className="mt-6">
              {selected && storyboard ? (
                <Link
                  href={`/dashboard/projects/${projectId}?step=storyboard`}
                  className="inline-block rounded-full border border-border-strong px-5 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
                >
                  Open storyboard →
                </Link>
              ) : (
                <ChooseConceptButton
                  projectId={projectId}
                  conceptId={concept.id}
                  replacesStoryboard={Boolean(storyboard)}
                />
              )}
            </div>
          </article>
        );
      })}

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
        <GenerateConceptsButton
          projectId={projectId}
          label="Write 3 new concepts"
          roundsLeft={roundsLeft}
        />
        <p className="text-[11px] text-fg-subtle">
          {roundsLeft > 0
            ? `${roundsLeft} ${roundsLeft === 1 ? "round" : "rounds"} left for this project.`
            : "No rounds left for this project."}
        </p>
      </div>
    </div>
  );
}
