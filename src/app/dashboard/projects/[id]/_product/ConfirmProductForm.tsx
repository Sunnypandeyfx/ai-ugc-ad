"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { FACT_LIMITS, type ConfirmedFacts } from "@/lib/product";
import { confirmProduct } from "./actions";

type Suggestion = { source: string; text: string };

type Props = {
  projectId: string;
  initial: ConfirmedFacts;
  prefilledFromAi: boolean;
  alreadyConfirmed: boolean;
  suggestions: Suggestion[];
  hasMain: boolean;
};

const input =
  "mt-1.5 w-full rounded-lg border border-border-strong bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent";

export default function ConfirmProductForm({
  projectId,
  initial,
  prefilledFromAi,
  alreadyConfirmed,
  suggestions,
  hasMain,
}: Props) {
  const [state, action] = useActionState(confirmProduct.bind(null, projectId), { error: null });
  const [facts, setFacts] = useState<string[]>(initial.facts);
  const [draft, setDraft] = useState("");

  const full = facts.length >= FACT_LIMITS.facts;
  const openSuggestions = suggestions.filter((s) => !facts.includes(s.text));

  function addFact(text: string) {
    const clean = text.trim().slice(0, FACT_LIMITS.fact);
    if (!clean || full || facts.includes(clean)) return;
    setFacts((prev) => [...prev, clean]);
  }

  return (
    <form action={action} className="space-y-5">
      {prefilledFromAi && (
        <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          Name, brand, category and description are pre-filled from the AI analysis.
          Check each one — correct anything that&rsquo;s wrong.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-xs text-fg-muted">
            Product name
          </label>
          <input id="name" name="name" defaultValue={initial.name} maxLength={FACT_LIMITS.name} required className={input} />
        </div>
        <div>
          <label htmlFor="brand_name" className="text-xs text-fg-muted">
            Brand <span className="text-fg-subtle">(optional)</span>
          </label>
          <input id="brand_name" name="brand_name" defaultValue={initial.brand_name} maxLength={FACT_LIMITS.brand_name} className={input} />
        </div>
      </div>

      <div>
        <label htmlFor="category" className="text-xs text-fg-muted">
          Category
        </label>
        <input
          id="category"
          name="category"
          defaultValue={initial.category}
          maxLength={FACT_LIMITS.category}
          placeholder="Face serum"
          className={input}
        />
      </div>

      <div>
        <label htmlFor="description" className="text-xs text-fg-muted">
          What it is, in your words
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={initial.description}
          maxLength={FACT_LIMITS.description}
          rows={3}
          placeholder="A lightweight vitamin C serum in a 30 ml glass dropper bottle, made for daily use."
          className={input}
        />
      </div>

      <div>
        <p className="text-xs text-fg-muted">Facts your ad may state</p>
        <p className="mt-1 text-[11px] leading-relaxed text-fg-subtle">
          Only these facts and the description above can be said in your ad. Add
          claims only if they&rsquo;re true and you can stand behind them — no
          invented results, ingredients or certifications.
        </p>

        {facts.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {facts.map((fact, i) => (
              <li
                key={`${i}-${fact}`}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm"
              >
                <span className="min-w-0 break-words">{fact}</span>
                <input type="hidden" name="fact" value={fact} />
                <button
                  type="button"
                  onClick={() => setFacts((prev) => prev.filter((_, j) => j !== i))}
                  aria-label={`Remove fact: ${fact}`}
                  className="shrink-0 text-xs text-fg-subtle hover:text-fg"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFact(draft);
                setDraft("");
              }
            }}
            maxLength={FACT_LIMITS.fact}
            disabled={full}
            placeholder={full ? `Up to ${FACT_LIMITS.facts} facts` : "e.g. Cruelty-free and vegan"}
            aria-label="New fact"
            className="w-full rounded-lg border border-border-strong bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => {
              addFact(draft);
              setDraft("");
            }}
            disabled={full || !draft.trim()}
            className="shrink-0 rounded-lg border border-border-strong px-3 text-xs text-fg transition-colors hover:bg-surface-2 disabled:opacity-50"
          >
            Add
          </button>
        </div>

        {openSuggestions.length > 0 && !full && (
          <div className="mt-4">
            <p className="text-[11px] text-fg-subtle">
              From the AI analysis — add only what&rsquo;s accurate:
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {openSuggestions.map((s) => (
                <button
                  key={`${s.source}-${s.text}`}
                  type="button"
                  onClick={() => addFact(s.text)}
                  title={s.source}
                  className="rounded-full border border-dashed border-border-strong px-2.5 py-1 text-left text-[11px] text-fg-muted transition-colors hover:border-accent hover:text-fg"
                >
                  + {s.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <label className="flex items-start gap-2.5 rounded-lg border border-border bg-bg-elevated p-3 text-xs leading-relaxed text-fg-muted">
        <input type="checkbox" name="confirm" value="yes" required className="mt-0.5 accent-[var(--accent)]" />
        These details are accurate, and Backlot may state them in my ads.
      </label>

      {state.error && <p className="text-xs text-red-400">{state.error}</p>}
      {!hasMain && <p className="text-xs text-fg-subtle">Add a main photo before confirming.</p>}

      <SubmitButton disabled={!hasMain} label={alreadyConfirmed ? "Save product details" : "Confirm and continue"} />
    </form>
  );
}

function SubmitButton({ disabled, label }: { disabled: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-fg transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}
