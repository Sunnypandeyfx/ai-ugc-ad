import Link from "next/link";
import Reveal from "@/components/Reveal";
import { STEPS } from "@/lib/projects";

const TECH_STACK = ["Claude", "Google Veo", "HeyGen"];

export default function Hero() {
  return (
    <section className="bg-hero-mesh relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg/40 via-bg/70 to-bg" />
      <div className="pointer-events-none absolute inset-0 opacity-50 bg-grid" />

      <div className="relative mx-auto grid max-w-[96rem] items-center gap-10 px-6 py-12 md:min-h-[calc(100dvh-4rem)] md:grid-cols-2 md:gap-20 md:px-12 md:py-10 lg:gap-28 lg:px-20 xl:px-28">
        <Reveal>
          <p className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface/80 px-3 py-1 text-xs uppercase tracking-wide text-fg-muted backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-pink" />
            AI ad production for bold brands
          </p>

          <h1 className="text-balance mt-5 font-display text-4xl leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
            Turn your product into
            <br />
            <span className="text-gradient">scroll-stopping ads.</span>
            <br />
            Instantly.
          </h1>

          <p className="text-balance mt-5 max-w-md text-base text-fg-muted md:text-lg">
            Upload a product photo and Backlot&rsquo;s AI writes the script,
            casts the creator, shoots the scene, and delivers UGC and
            cinematic ads ready to run — no camera, no studio, no wait.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="btn-gradient rounded-full px-6 py-3 text-center text-sm font-medium text-white transition-transform hover:scale-[1.03]"
            >
              Start creating — free
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full border border-border-strong bg-surface/60 px-6 py-3 text-center text-sm font-medium text-fg backdrop-blur transition-colors hover:bg-surface"
            >
              See how it works
            </Link>
          </div>

          <p className="mt-5 text-xs text-fg-subtle">
            No credit card required · Cancel anytime
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-6">
            <span className="text-xs text-fg-subtle">Built on</span>
            {TECH_STACK.map((name) => (
              <span key={name} className="text-sm font-medium text-fg-muted">
                {name}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={150}>
          <WorkflowPanel />
        </Reveal>
      </div>
    </section>
  );
}

function WorkflowPanel() {
  const sidebarSteps = STEPS.slice(0, 5);

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-8 -z-10 rounded-[40px] bg-gradient-to-br from-accent-2/25 via-accent-pink/15 to-accent/20 blur-3xl" />

      <div className="overflow-hidden rounded-2xl border border-border bg-surface/90 shadow-2xl shadow-black/50 backdrop-blur">
        <div className="flex items-center gap-2 border-b border-border bg-bg-elevated/80 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-fg-subtle/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-fg-subtle/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-fg-subtle/30" />
          <span className="ml-3 rounded-full bg-surface-2 px-3 py-1 text-[11px] text-fg-subtle">
            backlot.ai/dashboard
          </span>
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-0">
          <nav className="hidden flex-col gap-1 border-r border-border bg-bg-elevated/60 p-3 sm:flex">
            {sidebarSteps.map((step, i) => (
              <span
                key={step.key}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] ${
                  i === 2
                    ? "bg-accent-pink/15 text-fg"
                    : "text-fg-subtle"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] ${
                    i === 2 ? "bg-accent-pink text-white" : "border border-border-strong"
                  }`}
                >
                  {i + 1}
                </span>
                {step.label}
              </span>
            ))}
          </nav>

          <div className="space-y-3 p-4">
            <div className="rounded-xl border border-border bg-bg-elevated p-3">
              <p className="text-[11px] text-fg-subtle">Concept</p>
              <div className="mt-2 space-y-1.5">
                <div className="h-2 w-3/4 rounded-full bg-surface-2" />
                <div className="h-2 w-full rounded-full bg-surface-2" />
                <div className="h-2 w-2/3 rounded-full bg-surface-2" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <OutputThumb gradient="from-accent-2/50 via-surface-2 to-bg-elevated" duration="0:12" />
              <OutputThumb gradient="from-accent-pink/45 via-surface-2 to-bg-elevated" duration="0:08" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OutputThumb({ gradient, duration }: { gradient: string; duration: string }) {
  return (
    <div className={`relative aspect-[9/13] overflow-hidden rounded-lg bg-gradient-to-b ${gradient}`}>
      <div className="absolute inset-0 opacity-30 bg-grid" />
      <span className="absolute right-1.5 top-1.5 rounded-full bg-black/40 px-1.5 py-0.5 text-[9px] text-white/80">
        {duration}
      </span>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white" aria-hidden>
            <path d="M8 5v14l11-7L8 5Z" />
          </svg>
        </span>
      </div>
    </div>
  );
}
