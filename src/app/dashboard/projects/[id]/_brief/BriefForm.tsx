"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  AD_STYLES,
  DURATIONS,
  LANGUAGES,
  MUSIC_MOODS,
  OBJECTIVES,
  PLATFORMS,
  TONES,
  VOICEOVERS,
  type Brief,
} from "@/lib/brief";
import { saveBrief } from "./actions";

const input =
  "mt-1.5 w-full rounded-lg border border-border-strong bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent";

const NATIVE_RATIO: Record<string, string> = {
  tiktok: "9:16",
  instagram_reels: "9:16",
  youtube_shorts: "9:16",
  youtube: "16:9",
};

type Props = {
  projectId: string;
  aspectRatio: string;
  brief: Brief | null;
  audienceIdeas: string[];
};

export default function BriefForm({ projectId, aspectRatio, brief, audienceIdeas }: Props) {
  const [state, action] = useActionState(saveBrief.bind(null, projectId), { error: null });
  const [audience, setAudience] = useState(brief?.audience ?? "");
  const [platform, setPlatform] = useState(
    brief?.platform ?? (aspectRatio === "16:9" ? "youtube" : aspectRatio === "1:1" ? "meta_feed" : "tiktok"),
  );
  const adv = brief?.advanced ?? {};
  const hasAdvanced = Boolean(
    adv.key_message || adv.offer || adv.must_include || adv.must_avoid || adv.visual_direction || adv.brand_colors,
  );
  const ratioHint = NATIVE_RATIO[platform] && NATIVE_RATIO[platform] !== aspectRatio ? NATIVE_RATIO[platform] : null;

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select name="objective" label="Objective" options={OBJECTIVES} defaultValue={brief?.objective ?? "conversions"} />
        <div>
          <label htmlFor="platform" className="text-xs text-fg-muted">
            Platform
          </label>
          <select
            id="platform"
            name="platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className={input}
          >
            {PLATFORMS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {ratioHint && (
            <p className="mt-1.5 text-[11px] text-fg-subtle">
              This platform is usually {ratioHint}; your project is {aspectRatio}. You can change it in
              project settings.
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="audience" className="text-xs text-fg-muted">
          Who is this ad for?
        </label>
        <textarea
          id="audience"
          name="audience"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          required
          maxLength={300}
          rows={2}
          placeholder="Women 25–40 who care about simple, clean skincare routines"
          className={input}
        />
        {audienceIdeas.length > 0 && !audience && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {audienceIdeas.map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => setAudience(idea)}
                className="rounded-full border border-dashed border-border-strong px-2.5 py-1 text-[11px] text-fg-muted transition-colors hover:border-accent hover:text-fg"
              >
                {idea}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Select name="ad_style" label="Ad style" options={AD_STYLES} defaultValue={brief?.ad_style ?? "cinematic"} />
        <Select name="tone" label="Tone" options={TONES} defaultValue={brief?.tone ?? "premium"} />
        <Select
          name="duration_seconds"
          label="Length"
          options={DURATIONS.map((d) => ({ value: String(d), label: `${d} seconds` }))}
          defaultValue={String(brief?.duration_seconds ?? 30)}
        />
      </div>

      <div>
        <label htmlFor="cta" className="text-xs text-fg-muted">
          Call to action <span className="text-fg-subtle">(optional)</span>
        </label>
        <input
          id="cta"
          name="cta"
          defaultValue={brief?.cta ?? ""}
          maxLength={120}
          placeholder="Shop now at glowco.com"
          className={input}
        />
      </div>

      <details open={hasAdvanced} className="group rounded-xl border border-border bg-bg-elevated">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm">
          <span>
            Advanced direction <span className="text-xs text-fg-subtle">(optional)</span>
          </span>
          <span className="text-fg-subtle transition-transform group-open:rotate-45">+</span>
        </summary>
        <div className="space-y-4 border-t border-border px-4 py-4">
          <Text name="key_message" label="The one thing viewers should remember" defaultValue={adv.key_message} />
          <Text
            name="offer"
            label="Offer or promotion"
            hint="Only if it’s real — we’ll use it exactly as written."
            defaultValue={adv.offer}
            placeholder="20% off with code GLOW20 until 31 Oct"
          />
          <Text name="must_include" label="Must include" defaultValue={adv.must_include} placeholder="Show the dropper in use" />
          <Text
            name="must_avoid"
            label="Must avoid"
            defaultValue={adv.must_avoid}
            placeholder="No before/after comparisons, don't mention competitors"
          />
          <Text
            name="visual_direction"
            label="Visual direction"
            defaultValue={adv.visual_direction}
            placeholder="Soft morning light, marble bathroom, slow camera moves"
          />
          <Text name="brand_colors" label="Brand colors" defaultValue={adv.brand_colors} placeholder="Warm peach, off-white" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Select name="music" label="Music" options={MUSIC_MOODS} defaultValue={adv.music ?? ""} />
            <Select name="voiceover" label="Voiceover" options={VOICEOVERS} defaultValue={adv.voiceover ?? ""} />
            <Select name="language" label="Language" options={LANGUAGES} defaultValue={adv.language ?? "English"} />
          </div>
          <label className="flex items-center gap-2.5 text-xs text-fg-muted">
            <input
              type="checkbox"
              name="captions"
              defaultChecked={adv.captions ?? true}
              className="accent-[var(--accent)]"
            />
            Burn in captions (most people watch on mute)
          </label>
        </div>
      </details>

      {state.error && <p className="text-xs text-red-400">{state.error}</p>}
      <SubmitButton label={brief ? "Save brief" : "Save brief and continue"} />
    </form>
  );
}

function Select({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-xs text-fg-muted">
        {label}
      </label>
      <select id={name} name={name} defaultValue={defaultValue} className={input}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Text({
  name,
  label,
  hint,
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-xs text-fg-muted">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-[11px] text-fg-subtle">{hint}</p>}
      <input
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        maxLength={400}
        placeholder={placeholder}
        className={input}
      />
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-fg transition-transform hover:scale-[1.02] disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}
