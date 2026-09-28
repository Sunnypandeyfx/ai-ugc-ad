const CATEGORIES = [
  "DTC & ecommerce brands",
  "Performance marketing teams",
  "Marketplace sellers",
  "Creative & media agencies",
  "Founders shipping solo",
  "Subscription boxes",
];

export default function BuiltFor() {
  return (
    <section className="border-b border-border bg-bg-elevated py-10">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-xs uppercase tracking-widest text-fg-subtle">
          Built for teams turning products into ads, fast
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {CATEGORIES.map((c) => (
            <span key={c} className="text-sm text-fg-muted">
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
