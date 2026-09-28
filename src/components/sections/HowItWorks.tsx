import Reveal from "@/components/Reveal";

const STEPS = [
  {
    n: "01",
    title: "Upload your product",
    body: "Drop in product photos and a few lines about who you're selling to. That's the entire brief.",
  },
  {
    n: "02",
    title: "Backlot writes the concept",
    body: "Claude drafts hooks, scripts, and a shot list tuned to your audience and platform in seconds.",
  },
  {
    n: "03",
    title: "AI shoots it",
    body: "Pick a UGC creator to present and demo your product, or a cinematic scene for a studio-grade commercial.",
  },
  {
    n: "04",
    title: "Ship it everywhere",
    body: "Get auto-cropped exports for TikTok, Reels, YouTube, and paid feeds — ready to upload.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-sm font-medium text-accent">How it works</p>
          <h2 className="text-balance mt-3 max-w-xl font-display text-4xl leading-tight tracking-tight md:text-5xl">
            From product shot to finished ad, in four steps.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={i * 100}>
              <div className="h-full bg-bg p-8">
                <span className="font-display text-3xl text-fg-subtle">
                  {step.n}
                </span>
                <h3 className="mt-6 text-lg font-medium">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                  {step.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
