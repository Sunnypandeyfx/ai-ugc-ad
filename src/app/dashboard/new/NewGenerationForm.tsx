"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createGeneration, type CreateGenerationState } from "./actions";

const initialState: CreateGenerationState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 w-full rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-fg transition-transform hover:scale-[1.02] disabled:opacity-60"
    >
      {pending ? "Writing your script…" : "Generate script"}
    </button>
  );
}

export default function NewGenerationForm() {
  const [state, formAction] = useActionState(createGeneration, initialState);

  return (
    <form action={formAction} className="mt-10 space-y-5">
      <div>
        <label htmlFor="name" className="text-xs text-fg-muted">
          Product name
        </label>
        <input
          id="name"
          name="name"
          required
          className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
          placeholder="Glow Serum"
        />
      </div>

      <div>
        <label htmlFor="description" className="text-xs text-fg-muted">
          Product description
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={3}
          className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
          placeholder="A vitamin C serum that brightens skin in 2 weeks, cruelty-free, for daily use."
        />
      </div>

      <div>
        <label htmlFor="image" className="text-xs text-fg-muted">
          Product photo (optional for now)
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/*"
          className="mt-1.5 w-full rounded-lg border border-dashed border-border-strong bg-surface px-3 py-2.5 text-sm text-fg-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-xs file:text-fg"
        />
      </div>

      <div>
        <label htmlFor="audience" className="text-xs text-fg-muted">
          Target audience
        </label>
        <input
          id="audience"
          name="audience"
          required
          className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
          placeholder="Women 25-40 interested in clean skincare"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="platform" className="text-xs text-fg-muted">
            Platform
          </label>
          <select
            id="platform"
            name="platform"
            defaultValue="TikTok"
            className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
          >
            <option>TikTok</option>
            <option>Instagram Reels</option>
            <option>YouTube Shorts</option>
            <option>Paid feed</option>
          </select>
        </div>

        <div>
          <label htmlFor="adType" className="text-xs text-fg-muted">
            Ad type
          </label>
          <select
            id="adType"
            name="adType"
            defaultValue="ugc"
            className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
          >
            <option value="ugc">UGC creator</option>
            <option value="cinematic">Cinematic</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="tone" className="text-xs text-fg-muted">
          Tone (optional)
        </label>
        <input
          id="tone"
          name="tone"
          className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
          placeholder="Playful and confident"
        />
      </div>

      {state.error && <p className="text-xs text-red-400">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}
