import Reveal from "@/components/Reveal";
import AbstractArt from "@/components/AbstractArt";

const OLD_WAY = [
  "Coordinating a full production",
  "Booking talent and studios",
  "Multiple tools and handoffs",
  "Repeating the work for each idea",
];

const NEW_WAY = [
  "Start with your product and a brief",
  "Shape a script and shot list with AI",
  "Choose your creator and format",
  "Keep every version in one workspace",
];

export default function Comparison() {
  return (
    <section className="border-b border-border py-20">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 lg:grid-cols-2">
        <Reveal>
          <div className="relative h-full overflow-hidden rounded-2xl border border-border bg-surface p-7">
            <AbstractArt index={2} className="absolute inset-0 opacity-20" />
            <div className="relative">
              <span className="inline-block rounded-full border border-border-strong bg-bg/60 px-3 py-1 text-xs text-fg-muted backdrop-blur">
                The old way
              </span>
              <h3 className="mt-4 font-display text-2xl leading-tight tracking-tight">
                Manual ad creation is slow, expensive and exhausting.
              </h3>
              <ul className="mt-5 space-y-2.5 text-sm text-fg-muted">
                {OLD_WAY.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-0.5 text-fg-subtle">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="relative h-full overflow-hidden rounded-2xl border border-accent-pink/30 bg-surface p-7">
            <AbstractArt index={1} className="absolute inset-0 opacity-25" />
            <div className="relative">
              <span className="btn-gradient inline-block rounded-full px-3 py-1 text-xs font-medium text-white">
                The Backlot way
              </span>
              <h3 className="mt-4 font-display text-2xl leading-tight tracking-tight">
                More ideas. Better ads. A faster, smarter way.
              </h3>
              <ul className="mt-5 space-y-2.5 text-sm text-fg-muted">
                {NEW_WAY.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-0.5 text-accent-pink">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
