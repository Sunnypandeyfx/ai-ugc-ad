"use client";

import { useActionState } from "react";
import { MAX_ANALYSES_PER_PRODUCT, type ProductAnalysis } from "@/lib/product";
import { analyzeProduct } from "./actions";

type Props = {
  projectId: string;
  hasMain: boolean;
  running: boolean;
  failed: boolean;
  analysis: ProductAnalysis | null;
  analysisCount: number;
  photosChanged: boolean;
};

export default function AnalyzePanel({
  projectId,
  hasMain,
  running,
  failed,
  analysis,
  analysisCount,
  photosChanged,
}: Props) {
  const [state, action, pending] = useActionState(analyzeProduct.bind(null, projectId), {
    error: null,
  });
  const busy = pending || running;
  const remaining = MAX_ANALYSES_PER_PRODUCT - analysisCount;

  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-md">
          <h3 className="text-sm font-medium">AI product analysis</h3>
          <p className="mt-1 text-xs leading-relaxed text-fg-muted">
            Claude looks at your photos and suggests details. Its suggestions are
            guesses — nothing reaches your ad until you confirm it below.
          </p>
        </div>
        <form action={action}>
          <button
            type="submit"
            disabled={!hasMain || busy || remaining <= 0}
            className="rounded-full border border-border-strong px-4 py-2 text-xs font-medium text-fg transition-colors hover:bg-surface-2 disabled:opacity-50"
          >
            {busy ? "Analyzing photos…" : analysis ? "Analyze again" : "Analyze photos"}
          </button>
        </form>
      </div>

      {!hasMain && <p className="mt-3 text-xs text-fg-subtle">Add a main photo to enable analysis.</p>}
      {busy && (
        <p className="mt-3 text-xs text-fg-subtle">This usually takes 10–20 seconds.</p>
      )}
      {state.error && !busy && <p className="mt-3 text-xs text-red-400">{state.error}</p>}
      {failed && !state.error && !busy && (
        <p className="mt-3 text-xs text-red-400">
          The last analysis failed. Try again, or fill in the details yourself.
        </p>
      )}
      {analysis && photosChanged && !busy && (
        <p className="mt-3 text-xs text-amber-300/90">
          Your photos changed since this analysis. Run it again to include them.
        </p>
      )}
      {hasMain && remaining > 0 && remaining < MAX_ANALYSES_PER_PRODUCT && (
        <p className="mt-2 text-[11px] text-fg-subtle">
          {remaining} {remaining === 1 ? "analysis" : "analyses"} left for this product.
        </p>
      )}

      {analysis && (
        <div className="mt-5 border-t border-border pt-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-amber-300">
              AI assumption — not confirmed
            </span>
            <span className="text-[11px] text-fg-subtle">Confidence: {analysis.confidence}</span>
          </div>
          <p className="mt-3 text-sm text-fg">{analysis.summary}</p>
          <dl className="mt-4 grid gap-4 text-xs sm:grid-cols-2">
            <Row label="Name on pack" value={analysis.product_name} />
            <Row label="Brand" value={analysis.brand_name} />
            <Row label="Category" value={analysis.category} />
            <Row label="Colors" value={analysis.colors.join(", ")} />
            <List label="Text printed on the product" items={analysis.visible_text.map((t) => `“${t}”`)} />
            <List label="What’s visible" items={analysis.visual_features} />
            <List label="Audience ideas" items={analysis.suggested_audiences} />
            <List label="Can’t tell from photos" items={analysis.uncertainties} />
          </dl>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-fg-subtle">{label}</dt>
      <dd className="mt-0.5 text-fg-muted">{value || "—"}</dd>
    </div>
  );
}

function List({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <dt className="text-fg-subtle">{label}</dt>
      <dd className="mt-0.5 text-fg-muted">
        {items.length === 0 ? (
          "—"
        ) : (
          <ul className="space-y-0.5">
            {items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )}
      </dd>
    </div>
  );
}
