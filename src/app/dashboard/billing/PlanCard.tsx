"use client";

import { useState } from "react";
import type { PlanId } from "@/lib/dodo/client";

export default function PlanCard({
  planId,
  name,
  priceUsd,
  credits,
  features,
  currentPlan,
  highlighted,
}: {
  planId: PlanId;
  name: string;
  priceUsd: number;
  credits: number;
  features: string[];
  currentPlan: string;
  highlighted?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCurrent = currentPlan === planId;

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start checkout.");
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div
      className={`flex h-full flex-col rounded-2xl border p-8 ${
        highlighted ? "border-accent bg-surface shadow-xl shadow-accent/10" : "border-border bg-surface"
      }`}
    >
      {highlighted && (
        <span className="mb-4 inline-flex w-fit items-center rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
          Most popular
        </span>
      )}
      <h3 className="text-lg font-medium">{name}</h3>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-display text-4xl tracking-tight">${priceUsd}</span>
        <span className="text-sm text-fg-subtle">/ month</span>
      </div>
      <p className="mt-2 text-sm text-fg-muted">{credits} ad renders / month</p>

      <ul className="mt-6 flex-1 space-y-2">
        {features.map((f) => (
          <li key={f} className="text-sm text-fg-muted">
            • {f}
          </li>
        ))}
      </ul>

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleSubscribe}
        disabled={loading || isCurrent}
        className={`mt-6 rounded-full px-5 py-3 text-sm font-medium transition-colors disabled:opacity-60 ${
          highlighted
            ? "bg-accent text-accent-fg hover:opacity-90"
            : "border border-border-strong text-fg hover:bg-surface-2"
        }`}
      >
        {isCurrent ? "Current plan" : loading ? "Redirecting…" : "Subscribe"}
      </button>
    </div>
  );
}
