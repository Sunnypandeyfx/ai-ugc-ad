import Reveal from "@/components/Reveal";

const EXAMPLES = [
  {
    label: "UGC",
    category: "Skincare",
    hook: "“Okay, let me show you what’s actually in this bottle—”",
    gradient: "from-[#3a2418] via-[#211417] to-[#0c0b0d]",
  },
  {
    label: "Cinematic",
    category: "Footwear",
    hook: "Slow-motion product hero, studio lighting, no set required.",
    gradient: "from-[#1a2233] via-[#151519] to-[#0c0b0d]",
  },
  {
    label: "UGC",
    category: "Supplements",
    hook: "“Three things to know before you buy this—”",
    gradient: "from-[#20301f] via-[#141a15] to-[#0c0b0d]",
  },
];

export default function Showcase() {
  return (
    <section id="examples" className="border-b border-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-sm font-medium text-accent">Examples</p>
          <h2 className="text-balance mt-3 max-w-xl font-display text-4xl leading-tight tracking-tight md:text-5xl">
            Two formats. One upload.
          </h2>
          <p className="mt-4 max-w-lg text-fg-muted">
            Illustrative output styles — your dashboard renders real cuts
            from your own product photos once you connect a plan.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMPLES.map((ex, i) => (
            <Reveal key={ex.category} delay={i * 100}>
              <div className="group overflow-hidden rounded-2xl border border-border bg-surface">
                <div
                  className={`relative aspect-[9/14] bg-gradient-to-b ${ex.gradient}`}
                >
                  <div className="absolute inset-0 opacity-30 bg-grid" />
                  <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] uppercase tracking-wide text-white/80">
                    {ex.label}
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur transition-transform group-hover:scale-110">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="white"
                      >
                        <path d="M8 5v14l11-7L8 5Z" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute inset-x-3 bottom-3 rounded-lg bg-black/50 p-2.5 backdrop-blur">
                    <p className="text-[11px] leading-snug text-white">
                      {ex.hook}
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium">{ex.category}</p>
                  <p className="text-xs text-fg-subtle">
                    {ex.label} · vertical 9:16
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
