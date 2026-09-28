"use client";

import { useActionState } from "react";
import { SHOT_DURATION, SHOT_LIMITS, SHOT_TYPES, type ShotFields } from "@/lib/storyboard";
import type { ShotFormState } from "./actions";

const input =
  "mt-1 w-full rounded-lg border border-border-strong bg-bg px-3 py-2 text-sm outline-none focus:border-accent";

export default function ShotEditor({
  initial,
  submit,
  onDone,
  submitLabel,
}: {
  initial?: ShotFields;
  submit: (prev: ShotFormState, formData: FormData) => Promise<ShotFormState>;
  onDone: () => void;
  submitLabel: string;
}) {
  const [state, action, pending] = useActionState(async (prev: ShotFormState, formData: FormData) => {
    const result = await submit(prev, formData);
    if (result.saved) onDone();
    return result;
  }, { error: null, saved: false });

  return (
    <form action={action} className="space-y-3">
      <div className="grid grid-cols-[1fr_110px] gap-3">
        <label className="text-xs text-fg-muted">
          Shot type
          <select name="shot_type" defaultValue={initial?.shot_type ?? "product"} className={input}>
            {SHOT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-fg-muted">
          Seconds
          <input
            type="number"
            name="duration_seconds"
            min={SHOT_DURATION.min}
            max={SHOT_DURATION.max}
            defaultValue={initial?.duration_seconds ?? 3}
            required
            className={input}
          />
        </label>
      </div>
      <label className="block text-xs text-fg-muted">
        What&rsquo;s on screen
        <textarea
          name="scene"
          defaultValue={initial?.scene}
          required
          rows={3}
          maxLength={SHOT_LIMITS.scene}
          placeholder="Close-up of the bottle on wet marble, morning light catching the glass"
          className={input}
        />
      </label>
      <label className="block text-xs text-fg-muted">
        Camera
        <input name="camera" defaultValue={initial?.camera} maxLength={SHOT_LIMITS.camera} className={input} />
      </label>
      <label className="block text-xs text-fg-muted">
        On-screen text
        <input
          name="on_screen_text"
          defaultValue={initial?.on_screen_text}
          maxLength={SHOT_LIMITS.on_screen_text}
          className={input}
        />
      </label>
      <label className="block text-xs text-fg-muted">
        Voiceover
        <textarea
          name="voiceover"
          defaultValue={initial?.voiceover}
          rows={2}
          maxLength={SHOT_LIMITS.voiceover}
          className={input}
        />
      </label>
      <label className="block text-xs text-fg-muted">
        Sound
        <input name="sound" defaultValue={initial?.sound} maxLength={SHOT_LIMITS.sound} className={input} />
      </label>
      {state.error && <p className="text-xs text-red-400">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-fg disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={pending}
          className="rounded-full border border-border-strong px-4 py-2 text-xs text-fg-muted hover:text-fg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
