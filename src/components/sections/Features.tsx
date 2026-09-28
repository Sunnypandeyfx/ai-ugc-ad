import Reveal from "@/components/Reveal";

const FEATURES = [
  {
    title: "UGC creators",
    body: "A cast of AI creators delivers authentic-feeling reviews and demos — no talent booking, no shoot day.",
  },
  {
    title: "Cinematic commercials",
    body: "Studio-grade product scenes with real lighting and motion, generated without a set or a camera crew.",
  },
  {
    title: "On-brand, every time",
    body: "Lock your colors, fonts, and tone once in a brand kit. Every ad after that stays consistent automatically.",
  },
  {
    title: "Multi-platform cuts",
    body: "Vertical, square, and widescreen exports generated together — built for TikTok, Reels, and YouTube at once.",
  },
  {
    title: "Fast iteration",
    body: "Spin up a new hook or angle in minutes so you can A/B test creative instead of guessing what works.",
  },
  {
    title: "Built for teams",
    body: "Shared brand kits, review and approval flows, and usage visibility across everyone on your account.",
  },
];

export default function Features() {
  return (
    <section id="features" className="border-b border-border bg-bg-elevated py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-sm font-medium text-accent">Product</p>
          <h2 className="text-balance mt-3 max-w-xl font-display text-4xl leading-tight tracking-tight md:text-5xl">
            Everything an ad team needs, minus the ad team.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <div className="h-full rounded-2xl border border-border bg-surface p-7 transition-colors hover:border-border-strong">
                <div className="h-8 w-8 rounded-full bg-accent/15">
                  <div className="m-auto mt-2.5 h-3 w-3 rounded-full bg-accent" />
                </div>
                <h3 className="mt-5 text-base font-medium">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                  {f.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
