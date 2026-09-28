import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AdScript } from "@/lib/ai/generateScript";
import VideoPanel from "./VideoPanel";

export const metadata: Metadata = { title: "Ad script" };

export default async function GenerationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/dashboard/${id}`);

  const { data: generation } = await supabase
    .from("generations")
    .select(
      "id, ad_type, platform, audience, tone, status, script, error, avatar_id, avatar_name, voice_id, video_status, video_url, video_error, products(name, description)",
    )
    .eq("id", id)
    .single();

  if (!generation) notFound();

  const product = generation.products as unknown as {
    name: string;
    description: string;
  } | null;
  const script = generation.script as AdScript | null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/dashboard" className="text-sm text-fg-muted hover:text-fg">
        ← Back to ads
      </Link>

      <div className="mt-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">
            {product?.name ?? "Untitled product"}
          </h1>
          <p className="mt-2 text-sm text-fg-muted">
            {generation.ad_type === "ugc" ? "UGC creator" : "Cinematic"} ·{" "}
            {generation.platform} · for {generation.audience}
          </p>
        </div>
      </div>

      {generation.status === "queued" && (
        <p className="mt-10 text-sm text-fg-muted">Writing your script…</p>
      )}

      {generation.status === "failed" && (
        <div className="mt-10 rounded-xl border border-red-900/50 bg-red-950/20 p-5">
          <p className="text-sm text-red-400">
            Generation failed: {generation.error ?? "Unknown error"}
          </p>
        </div>
      )}

      {generation.status === "script_ready" && script && (
        <div className="mt-10 space-y-8">
          <div>
            <p className="text-xs uppercase tracking-wide text-accent">Hook</p>
            <p className="mt-2 text-lg font-medium">{script.hook}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-accent">
              Concept
            </p>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              {script.concept_summary}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-accent">
              Shot list
            </p>
            <ol className="mt-3 space-y-4">
              {script.shots.map((shot) => (
                <li
                  key={shot.shot_number}
                  className="rounded-xl border border-border bg-surface p-4"
                >
                  <div className="flex items-center justify-between text-xs text-fg-subtle">
                    <span>Shot {shot.shot_number}</span>
                    <span>{shot.duration_seconds}s</span>
                  </div>
                  <p className="mt-2 text-sm">{shot.description}</p>
                  {shot.dialogue_or_voiceover && (
                    <p className="mt-2 text-sm italic text-fg-muted">
                      &ldquo;{shot.dialogue_or_voiceover}&rdquo;
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {script.on_screen_captions.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-accent">
                On-screen captions
              </p>
              <ul className="mt-2 space-y-1 text-sm text-fg-muted">
                {script.on_screen_captions.map((c, i) => (
                  <li key={i}>&bull; {c}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-wide text-accent">CTA</p>
            <p className="mt-2 text-sm font-medium">{script.cta}</p>
          </div>

          {generation.ad_type === "ugc" ? (
            <VideoPanel
              generationId={generation.id}
              canRender
              initialStatus={generation.video_status as "not_started" | "rendering" | "ready" | "failed"}
              initialUrl={generation.video_url}
              initialError={generation.video_error}
              avatarName={generation.avatar_name}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-border-strong p-5 text-sm text-fg-subtle">
              Cinematic video rendering isn&rsquo;t connected yet — only UGC
              creator videos can be rendered right now.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
