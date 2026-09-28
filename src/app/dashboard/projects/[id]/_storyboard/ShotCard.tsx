"use client";

import { useState, useTransition } from "react";
import { shotTypeLabel, type Shot } from "@/lib/storyboard";
import { deleteShot, moveShot, saveShot } from "./actions";
import ShotEditor from "./ShotEditor";

export default function ShotCard({
  projectId,
  shot,
  number,
  startsAt,
  isFirst,
  isLast,
}: {
  projectId: string;
  shot: Shot;
  number: number;
  startsAt: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ error: string | null }>) {
    setError(null);
    start(async () => {
      const result = await fn();
      if (result.error) setError(result.error);
    });
  }

  return (
    <li className={`rounded-xl border border-border bg-bg-elevated p-4 md:p-5 ${busy ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-xs font-medium">
            {number}
          </span>
          <span className="text-xs text-fg-muted">{shotTypeLabel(shot.shot_type)}</span>
          <span className="text-xs text-fg-subtle">
            {startsAt}s–{startsAt + shot.duration_seconds}s · {shot.duration_seconds}s
          </span>
        </div>
        {!editing && (
          <div className="flex items-center gap-1">
            <IconButton label={`Move shot ${number} up`} disabled={isFirst || busy} onClick={() => run(() => moveShot(projectId, shot.id, -1))}>
              ↑
            </IconButton>
            <IconButton label={`Move shot ${number} down`} disabled={isLast || busy} onClick={() => run(() => moveShot(projectId, shot.id, 1))}>
              ↓
            </IconButton>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-full px-3 py-1 text-xs text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              Edit
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (window.confirm(`Delete shot ${number}?`)) run(() => deleteShot(projectId, shot.id));
              }}
              className="rounded-full px-3 py-1 text-xs text-fg-subtle transition-colors hover:bg-surface-2 hover:text-red-300"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-4">
          <ShotEditor
            initial={shot}
            submit={saveShot.bind(null, projectId, shot.id)}
            onDone={() => setEditing(false)}
            submitLabel="Save shot"
          />
        </div>
      ) : (
        <div className="mt-3 space-y-3 text-sm">
          <p className="text-fg">{shot.scene}</p>
          <dl className="grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
            <Field label="Camera" value={shot.camera} />
            <Field label="Sound" value={shot.sound} />
            <Field label="On-screen text" value={shot.on_screen_text} quote />
            <Field label="Voiceover" value={shot.voiceover} quote />
          </dl>
          {shot.facts_used.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-fg-subtle">Uses confirmed:</span>
              {shot.facts_used.map((fact) => (
                <span key={fact} className="rounded-full border border-border-strong px-2 py-0.5 text-[11px] text-fg-muted">
                  {fact}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </li>
  );
}

function Field({ label, value, quote }: { label: string; value: string; quote?: boolean }) {
  return (
    <div>
      <dt className="text-fg-subtle">{label}</dt>
      <dd className="mt-0.5 text-fg-muted">{value ? (quote ? `“${value}”` : value) : "—"}</dd>
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-full text-xs text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-30"
    >
      {children}
    </button>
  );
}
