const PALETTES = [
  "from-accent-2/45 via-surface-2 to-bg-elevated",
  "from-accent-pink/40 via-surface-2 to-bg-elevated",
  "from-accent/40 via-surface-2 to-bg-elevated",
  "from-accent-2/35 via-accent-pink/15 to-bg-elevated",
  "from-accent-pink/35 via-accent/15 to-bg-elevated",
  "from-accent/35 via-accent-2/15 to-bg-elevated",
];

// A faceless, productless gradient block used everywhere the design calls
// for "example ad" art. Deliberately abstract — no AI-generated people or
// products, so nothing here can be mistaken for a real customer, a real
// generated result, or a real testimonial.
export default function AbstractArt({
  index = 0,
  className = "",
}: {
  index?: number;
  className?: string;
}) {
  const palette = PALETTES[index % PALETTES.length];
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${palette} ${className}`}
    >
      <div className="absolute inset-0 opacity-25 bg-grid" />
      <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-md" />
    </div>
  );
}
