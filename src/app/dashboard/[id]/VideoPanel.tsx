"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { renderVideo } from "./actions";

type VideoStatus = "not_started" | "rendering" | "ready" | "failed";

export default function VideoPanel({
  generationId,
  canRender,
  initialStatus,
  initialUrl,
  initialError,
  avatarName,
  creditsRemaining,
}: {
  generationId: string;
  canRender: boolean;
  initialStatus: VideoStatus;
  initialUrl: string | null;
  initialError: string | null;
  avatarName: string | null;
  creditsRemaining: number | null;
}) {
  const [status, setStatus] = useState<VideoStatus>(initialStatus);
  const [videoUrl, setVideoUrl] = useState(initialUrl);
  const [videoError, setVideoError] = useState(initialError);
  const [isPending, startTransition] = useTransition();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status !== "rendering") return;

    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/generations/${generationId}/video-status`);
      const data = await res.json();
      if (data.video_status === "ready") {
        setStatus("ready");
        setVideoUrl(data.video_url);
        if (pollRef.current) clearInterval(pollRef.current);
      } else if (data.video_status === "failed") {
        setStatus("failed");
        setVideoError(data.video_error);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status, generationId]);

  function handleRender() {
    setVideoError(null);
    startTransition(async () => {
      const result = await renderVideo(generationId);
      if (result.error) {
        setStatus("failed");
        setVideoError(result.error);
      } else {
        setStatus("rendering");
      }
    });
  }

  if (!canRender) return null;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-wide text-accent">Video</p>

      {status === "not_started" && (
        <>
          <p className="mt-2 text-sm text-fg-muted">
            {avatarName ? `Creator: ${avatarName}` : "Ready to render."}
          </p>
          {creditsRemaining !== null && (
            <p className="mt-1 text-xs text-fg-subtle">
              {creditsRemaining > 0
                ? `${creditsRemaining} free render${creditsRemaining === 1 ? "" : "s"} left`
                : "No free renders left — upgrade to keep rendering"}
            </p>
          )}
          <button
            type="button"
            onClick={handleRender}
            disabled={isPending}
            className="mt-4 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {isPending ? "Starting…" : "Render video"}
          </button>
        </>
      )}

      {status === "rendering" && (
        <p className="mt-2 text-sm text-fg-muted">
          Rendering with {avatarName ?? "your creator"}… this usually takes
          30–90 seconds.
        </p>
      )}

      {status === "failed" && (
        <>
          <p className="mt-2 text-sm text-red-400">{videoError ?? "Render failed."}</p>
          <button
            type="button"
            onClick={handleRender}
            disabled={isPending}
            className="mt-4 rounded-full border border-border-strong px-5 py-2.5 text-sm font-medium text-fg hover:bg-surface-2"
          >
            Try again
          </button>
        </>
      )}

      {status === "ready" && videoUrl && (
        <video
          src={videoUrl}
          controls
          className="mt-3 aspect-[9/16] w-full max-w-xs rounded-lg bg-black"
        />
      )}
    </div>
  );
}
