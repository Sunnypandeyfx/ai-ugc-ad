"use client";

import { useActionState } from "react";
import { ASPECT_RATIOS, ASPECT_RATIO_LABELS } from "@/lib/projects";
import { saveProjectSettings, type ProjectSettingsState } from "./actions";

const initialState: ProjectSettingsState = { error: null, saved: false };

export default function ProjectSettingsForm({
  projectId,
  title,
  aspectRatio,
}: {
  projectId: string;
  title: string;
  aspectRatio: string;
}) {
  const [state, formAction, pending] = useActionState(
    saveProjectSettings.bind(null, projectId),
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="title" className="text-xs text-fg-muted">
          Project name
        </label>
        <input
          id="title"
          name="title"
          defaultValue={title}
          maxLength={80}
          required
          className="mt-1.5 w-full rounded-lg border border-border-strong bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div>
        <label htmlFor="aspectRatio" className="text-xs text-fg-muted">
          Aspect ratio
        </label>
        <select
          id="aspectRatio"
          name="aspectRatio"
          defaultValue={aspectRatio}
          className="mt-1.5 w-full rounded-lg border border-border-strong bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent"
        >
          {ASPECT_RATIOS.map((r) => (
            <option key={r} value={r}>
              {ASPECT_RATIO_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      {state.error && <p className="text-xs text-red-400">{state.error}</p>}
      {state.saved && !pending && <p className="text-xs text-fg-subtle">Saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full border border-border-strong px-4 py-2 text-sm font-medium text-fg transition-colors hover:bg-surface-2 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
