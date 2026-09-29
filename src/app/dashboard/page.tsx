import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STATUSES, STEPS, stepIndex } from "@/lib/projects";
import CreateProjectButton from "./CreateProjectButton";
import DeleteEntryButton from "./DeleteEntryButton";
import ProjectVideoPreview from "./ProjectVideoPreview";
import { deleteGeneration, deleteProject } from "./actions";

export const metadata: Metadata = {
  title: "Dashboard",
  alternates: { canonical: "/dashboard" },
};

const LEGACY_STATUS: Record<string, string> = {
  queued: "Writing script…",
  script_ready: "Script ready",
  failed: "Script failed",
};

const VIDEO_STATUS: Record<string, string> = {
  rendering: "Video rendering",
  ready: "Video ready",
  failed: "Render failed",
};

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard");

  const [{ data: profile }, { data: projects }, { data: generations }] = await Promise.all([
    supabase.from("profiles").select("credits_remaining, plan").eq("id", user.id).single(),
    supabase
      .from("projects")
      .select("id, title, status, current_step, aspect_ratio, updated_at")
      .order("updated_at", { ascending: false }),
    supabase
      .from("generations")
      .select("id, ad_type, platform, status, video_status, video_url, created_at, products(name)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const groups = PROJECT_STATUSES.map((s) => ({
    ...s,
    items: (projects ?? []).filter((p) => p.status === s.key),
  })).filter((g) => g.items.length > 0);

  // One generated shot per project, most recent first, to use as a
  // preview thumbnail — final assembled videos don't exist yet, so this is
  // the closest thing to "the video the client made" on the dashboard.
  const previewByProject = new Map<string, string>();
  const projectIds = (projects ?? []).map((p) => p.id);
  if (projectIds.length > 0) {
    const { data: shots } = await supabase
      .from("storyboard_shots")
      .select("project_id, video_url, created_at")
      .in("project_id", projectIds)
      .eq("video_status", "ready")
      .order("created_at", { ascending: false });
    for (const shot of shots ?? []) {
      if (shot.video_url && !previewByProject.has(shot.project_id)) {
        previewByProject.set(shot.project_id, shot.video_url);
      }
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Your projects</h1>
          <p className="mt-1 text-sm text-fg-muted">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href="/dashboard/creators"
              className="text-xs text-fg-muted underline underline-offset-4 hover:text-fg"
            >
              My creators
            </Link>
            <Link
              href="/dashboard/billing"
              className="text-xs text-fg-muted underline underline-offset-4 hover:text-fg"
            >
              Billing
            </Link>
            <Link
              href="/dashboard/new"
              className="text-xs text-fg-muted underline underline-offset-4 hover:text-fg"
            >
              Quick UGC script (classic)
            </Link>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <CreateProjectButton />
          {profile && (
            <Link href="/dashboard/billing" className="text-xs text-fg-subtle hover:text-fg">
              <span className="capitalize">{profile.plan}</span> plan ·{" "}
              {profile.credits_remaining} credit
              {profile.credits_remaining === 1 ? "" : "s"} left
            </Link>
          )}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-border-strong p-12 text-center">
          <p className="font-display text-xl">Start your first ad</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
            A project walks you from product photos to a finished commercial —
            and saves your progress at every step.
          </p>
          <div className="mt-6 flex justify-center">
            <CreateProjectButton label="Create your first ad" />
          </div>
        </div>
      ) : (
        <div className="mt-12 space-y-10">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="text-sm font-medium text-fg-muted">
                {group.label}{" "}
                <span className="text-fg-subtle">({group.items.length})</span>
              </h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((p) => {
                  const idx = stepIndex(p.current_step);
                  const previewUrl = previewByProject.get(p.id);
                  return (
                    <li key={p.id} className="group relative">
                      <Link
                        href={`/dashboard/projects/${p.id}`}
                        className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-border-strong"
                      >
                        {previewUrl && <ProjectVideoPreview videoUrl={previewUrl} />}
                        <div className="flex-1 p-5">
                          <p className={`truncate font-medium ${previewUrl ? "" : "pr-6"}`}>{p.title}</p>
                          <p className="mt-1 text-xs text-fg-subtle">
                            Step {idx + 1} of {STEPS.length} · {STEPS[idx].label} ·{" "}
                            {p.aspect_ratio}
                          </p>
                          <div className="mt-4 h-1 overflow-hidden rounded-full bg-surface-2">
                            <div
                              className="h-full rounded-full bg-accent"
                              style={{ width: `${((idx + 1) / STEPS.length) * 100}%` }}
                            />
                          </div>
                          <p className="mt-3 text-xs text-fg-subtle">
                            Updated {timeAgo(p.updated_at)}
                          </p>
                        </div>
                      </Link>
                      <DeleteEntryButton
                        label={`Delete ${p.title}`}
                        confirmMessage={`Delete "${p.title}"? This can't be undone.`}
                        action={deleteProject.bind(null, p.id)}
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {generations && generations.length > 0 && (
        <section className="mt-16">
          <h2 className="text-sm font-medium text-fg-muted">Earlier ads</h2>
          <ul className="mt-3 divide-y divide-border border-t border-border">
            {generations.map((g) => (
              <li key={g.id} className="group relative">
                <Link
                  href={`/dashboard/${g.id}`}
                  className="flex items-center gap-4 py-4 pr-9 transition-colors hover:opacity-80"
                >
                  {g.video_status === "ready" && g.video_url ? (
                    <ProjectVideoPreview
                      videoUrl={g.video_url}
                      className="aspect-[3/4] w-14 rounded-lg"
                      iconSize="h-6 w-6"
                    />
                  ) : (
                    <div className="flex aspect-[3/4] w-14 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-fg-subtle">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M8 5v14l11-7L8 5Z" fill="currentColor" opacity="0.4" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {(g.products as unknown as { name: string } | null)?.name ??
                        "Untitled product"}
                    </p>
                    <p className="mt-1 text-xs text-fg-subtle">
                      {g.ad_type === "ugc" ? "UGC" : "Cinematic"} · {g.platform} ·{" "}
                      {timeAgo(g.created_at)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-border-strong px-3 py-1 text-xs text-fg-muted">
                    {VIDEO_STATUS[g.video_status] ?? LEGACY_STATUS[g.status] ?? g.status}
                  </span>
                </Link>
                <DeleteEntryButton
                  label="Delete this ad"
                  confirmMessage="Delete this ad? This can't be undone."
                  action={deleteGeneration.bind(null, g.id)}
                  position="center-right"
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
