"use client";

import { useState, useTransition } from "react";
import { addShot, approveStoryboard } from "./actions";
import { regenerateStoryboard } from "../_concept/actions";
import ShotEditor from "./ShotEditor";

export function AddShot({ projectId, disabled }: { projectId: string; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  if (open) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong p-4 md:p-5">
        <p className="mb-3 text-xs text-fg-muted">New shot (added at the end — move it with the arrows)</p>
        <ShotEditor submit={addShot.bind(null, projectId)} onDone={() => setOpen(false)} submitLabel="Add shot" />
      </div>
    );
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setOpen(true)}
      className="w-full rounded-xl border border-dashed border-border-strong py-3 text-xs text-fg-muted transition-colors hover:border-accent hover:text-fg disabled:opacity-50"
    >
      + Add a shot
    </button>
  );
}

export function ApproveButton({ projectId, ready }: { projectId: string; ready: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        disabled={pending || !ready}
        onClick={() => {
          setError(null);
          start(async () => {
            const result = await approveStoryboard(projectId);
            if (result?.error) setError(result.error);
          });
        }}
        className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-fg transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
      >
        {pending ? "Approving…" : "Approve storyboard"}
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function RegenerateButton({ projectId, left }: { projectId: string; left: number }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        disabled={pending || left <= 0}
        onClick={() => {
          if (!window.confirm("Rewrite the storyboard from the same concept? Your current shots and edits are replaced.")) {
            return;
          }
          setError(null);
          start(async () => {
            const result = await regenerateStoryboard(projectId);
            if (result.error) setError(result.error);
          });
        }}
        className="text-xs text-fg-muted underline underline-offset-4 transition-colors hover:text-fg disabled:opacity-50"
      >
        {pending ? "Rewriting storyboard… (30–60 seconds)" : "Rewrite storyboard from this concept"}
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
