import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STEPS, stepIndex, statusLabel, type StepKey } from "@/lib/projects";
import ProjectSettingsForm from "./ProjectSettingsForm";
import ProductStep from "./_product/ProductStep";
import BriefStep from "./_brief/BriefStep";

export const metadata: Metadata = { title: "Project" };

// Product analysis sends several photos to Claude from a server action.
export const maxDuration = 60;

export default async function ProjectWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const { id } = await params;
  const { step: requestedStep } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/projects/${id}`);

  // Read through the user's session so RLS proves ownership.
  const { data: project } = await supabase
    .from("projects")
    .select("id, title, status, current_step, aspect_ratio, product_id, created_at, updated_at")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const reachedIndex = stepIndex(project.current_step);
  const requestedIndex = requestedStep ? stepIndex(requestedStep) : reachedIndex;
  // Steps after the one the project has reached stay locked.
  const viewIndex = Math.min(requestedIndex, reachedIndex);
  const viewStep = STEPS[viewIndex];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-sm text-fg-muted hover:text-fg">
            ← All projects
          </Link>
          <h1 className="mt-2 font-display text-2xl tracking-tight md:text-3xl">
            {project.title}
          </h1>
        </div>
        <span className="rounded-full border border-border-strong px-3 py-1 text-xs text-fg-muted">
          {statusLabel(project.status)} · {project.aspect_ratio}
        </span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
        <nav aria-label="Project steps" className="lg:sticky lg:top-24 lg:self-start">
          <ol className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {STEPS.map((step, i) => {
              const done = i < reachedIndex;
              const locked = i > reachedIndex;
              const active = i === viewIndex;
              const content = (
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
                      done
                        ? "bg-accent text-accent-fg"
                        : active
                          ? "border border-accent text-accent"
                          : "border border-border-strong text-fg-subtle"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span className={locked ? "text-fg-subtle" : "text-fg"}>{step.label}</span>
                </span>
              );
              return (
                <li key={step.key} className="shrink-0">
                  {locked ? (
                    <span
                      className="block rounded-lg px-3 py-2 text-sm opacity-60"
                      title="Finish the earlier steps first"
                    >
                      {content}
                    </span>
                  ) : (
                    <Link
                      href={`/dashboard/projects/${project.id}?step=${step.key}`}
                      aria-current={active ? "step" : undefined}
                      className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                        active ? "bg-surface" : "hover:bg-surface"
                      }`}
                    >
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <section className="min-h-[420px] rounded-2xl border border-border bg-surface p-6 md:p-8">
          <p className="text-xs uppercase tracking-wide text-accent">
            Step {viewIndex + 1} of {STEPS.length}
          </p>
          <h2 className="mt-2 font-display text-2xl tracking-tight">{viewStep.label}</h2>
          <p className="mt-2 max-w-lg text-sm text-fg-muted">{viewStep.blurb}</p>
          {viewStep.key === "product" ? (
            <ProductStep projectId={project.id} productId={project.product_id} userId={user.id} />
          ) : viewStep.key === "brief" ? (
            <BriefStep
              projectId={project.id}
              productId={project.product_id}
              aspectRatio={project.aspect_ratio}
            />
          ) : (
            <StepBody step={viewStep.key} />
          )}
        </section>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs uppercase tracking-wide text-accent">Project</p>
            <div className="mt-4">
              <ProjectSettingsForm
                projectId={project.id}
                title={project.title}
                aspectRatio={project.aspect_ratio}
              />
            </div>
          </div>
          <p className="px-1 text-xs text-fg-subtle">
            Progress saves automatically — you can leave and come back to this
            project anytime from your dashboard.
          </p>
        </aside>
      </div>
    </div>
  );
}

function StepBody({ step }: { step: StepKey }) {
  // Steps not built yet say so plainly instead of showing mock UI.
  return (
    <div className="mt-8 rounded-xl border border-dashed border-border-strong p-6">
      <p className="text-sm text-fg">Not available yet</p>
      <p className="mt-1 text-sm text-fg-muted">
        {step === "concept"
          ? "Your product and brief are saved. Three distinct ad concepts, written only from your confirmed facts, arrive in the next update."
          : "This step unlocks once the earlier steps are built and completed."}
      </p>
    </div>
  );
}
