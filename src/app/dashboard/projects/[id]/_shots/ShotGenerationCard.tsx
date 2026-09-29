"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Shot } from "@/lib/storyboard";
import { checkShotGeneration, generateShot, revertShotToVersion } from "./actions";

type ShotWithVideo = Shot & {
  video_status: string;
  video_url: string | null;
  video_error: string | null;
  generation_count: number;
  active_job_id: string | null;
};

type Version = { id: string; video_url: string; created_at: string };

const POLL_MS = 4000;

export default function ShotGenerationCard({
  projectId,
  shot,
  cost,
  creditsRemaining,
  maxGenerations,
  versions,
}: {
  projectId: string;
  shot: ShotWithVideo;
  cost: number;
  creditsRemaining: number;
  maxGenerations: number;
  versions: Version[];
}) {
  const [status, setStatus] = useState(shot.video_status);
  const [videoUrl, setVideoUrl] = useState(shot.video_url);
  const [videoError, setVideoError] = useState(shot.video_error);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const active = status === "queued" || status === "generating";
    if (!active) {
      if (timer.current) clearInterval(timer.current);
      return;
    }
    timer.current = setInterval(async () => {
      const result = await checkShotGeneration(projectId, shot.id);
      setStatus(result.video_status);
      setVideoUrl(result.video_url);
      setVideoError(result.video_error);
    }, POLL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [status, projectId, shot.id]);

  const atLimit = shot.generation_count >= maxGenerations;
  const canAfford = creditsRemaining >= cost;
  const busy = pending || status === "queued" || status === "generating";

  function handleGenerate() {
    if (
      !window.confirm(
        `Generate this shot for ${cost} credit${cost === 1 ? "" : "s"}? You have ${creditsRemaining} left.`,
      )
    ) {
      return;
    }
    setError(null);
    start(async () => {
      const result = await generateShot(projectId, shot.id);
      if (result.error) {
        setError(result.error);
      } else {
        setStatus("queued");
      }
    });
  }

  function handleRevert(jobId: string, url: string) {
    setError(null);
    start(async () => {
      const result = await revertShotToVersion(projectId, shot.id, jobId);
      if (result.error) setError(result.error);
      else {
        setVideoUrl(url);
        setStatus("ready");
      }
    });
  }

  return (
    <div className="mt-3 space-y-3">
      {status === "ready" && videoUrl && (
        <video src={videoUrl} controls className="w-full max-w-xs rounded-lg border border-border" />
      )}
      {(status === "queued" || status === "generating") && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border-strong px-3 py-3 text-xs text-fg-muted">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-fg-subtle/40 border-t-fg-muted" />
          {status === "queued" ? "Queued…" : "Generating… this can take a minute or two."}
        </div>
      )}
      {status === "failed" && videoError && <p className="text-xs text-red-400">{videoError}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={busy || atLimit || !canAfford}
          className="rounded-full border border-border-strong px-4 py-2 text-xs font-medium text-fg transition-colors hover:bg-surface-2 disabled:opacity-50"
        >
          {status === "ready"
            ? `Regenerate (${cost} credit${cost === 1 ? "" : "s"})`
            : `Generate (${cost} credit${cost === 1 ? "" : "s"})`}
        </button>
        <span className="text-[11px] text-fg-subtle">
          {shot.generation_count}/{maxGenerations} generations used
        </span>
      </div>
      {atLimit && (
        <p className="text-[11px] text-fg-subtle">This shot has reached its generation limit.</p>
      )}
      {!canAfford && !atLimit && (
        <p className="text-[11px] text-amber-300">Not enough credits — add more from Billing.</p>
      )}

      {versions.length > 1 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-fg-subtle hover:text-fg">
            {versions.length} previous versions
          </summary>
          <ul className="mt-2 space-y-1.5">
            {versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3">
                <span className="text-fg-subtle">{new Date(v.created_at).toLocaleString()}</span>
                <button
                  type="button"
                  onClick={() => handleRevert(v.id, v.video_url)}
                  disabled={pending || v.video_url === videoUrl}
                  className="text-fg-muted underline underline-offset-4 hover:text-fg disabled:opacity-40"
                >
                  {v.video_url === videoUrl ? "Current" : "Use this version"}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
