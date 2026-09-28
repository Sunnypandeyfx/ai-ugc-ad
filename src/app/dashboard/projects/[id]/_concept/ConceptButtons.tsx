"use client";

import { useState, useTransition } from "react";
import { chooseConcept, generateConcepts } from "./actions";

export function GenerateConceptsButton({
  projectId,
  label,
  roundsLeft,
  primary,
}: {
  projectId: string;
  label: string;
  roundsLeft: number;
  primary?: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending || roundsLeft <= 0}
        onClick={() => {
          setError(null);
          start(async () => {
            const result = await generateConcepts(projectId);
            if (result.error) setError(result.error);
          });
        }}
        className={
          primary
            ? "rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-fg transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
            : "rounded-full border border-border-strong px-4 py-2 text-xs font-medium text-fg transition-colors hover:bg-surface-2 disabled:opacity-50"
        }
      >
        {pending ? "Writing concepts…" : label}
      </button>
      {pending && (
        <p className="mt-2 text-xs text-fg-subtle">
          Claude is writing three directions from your confirmed facts and brief. This takes about 20–40 seconds.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function ChooseConceptButton({
  projectId,
  conceptId,
  replacesStoryboard,
}: {
  projectId: string;
  conceptId: string;
  replacesStoryboard: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (
            replacesStoryboard &&
            !window.confirm("This writes a new storyboard and replaces your current one, including any edits. Continue?")
          ) {
            return;
          }
          setError(null);
          start(async () => {
            const result = await chooseConcept(projectId, conceptId);
            if (result?.error) setError(result.error);
          });
        }}
        className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
      >
        {pending ? "Writing storyboard…" : "Use this concept"}
      </button>
      {pending && (
        <p className="mt-2 text-xs text-fg-subtle">Turning this concept into shots. About 30–60 seconds.</p>
      )}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
