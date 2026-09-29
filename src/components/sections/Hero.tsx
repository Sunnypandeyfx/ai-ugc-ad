import Link from "next/link";
import Reveal from "@/components/Reveal";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-grid">
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />

      <div className="relative mx-auto grid max-w-[96rem] items-center gap-10 px-6 py-12 md:min-h-[calc(100dvh-4rem)] md:grid-cols-2 md:gap-20 md:px-12 md:py-10 lg:gap-28 lg:px-20 xl:px-28">
        <Reveal>
          <p className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-3 py-1 text-xs text-fg-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Now rendering UGC &amp; cinematic ads
          </p>

          <h1 className="text-balance mt-5 font-display text-4xl leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
            Your product.
            <br />
            A full ad campaign.
            <br />
            <span className="italic text-accent">By tomorrow morning.</span>
          </h1>

          <p className="text-balance mt-5 max-w-md text-base text-fg-muted md:text-lg">
            Upload a product photo and Backlot&rsquo;s AI writes the script,
            casts the creator, shoots the scene, and delivers UGC and
            cinematic ads ready to run — no camera, no studio, no wait.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-full bg-accent px-6 py-3 text-center text-sm font-medium text-accent-fg transition-transform hover:scale-[1.03]"
            >
              Start creating — free
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full border border-border-strong px-6 py-3 text-center text-sm font-medium text-fg transition-colors hover:bg-surface"
            >
              See how it works
            </Link>
          </div>

          <p className="mt-5 text-xs text-fg-subtle">
            No credit card required · Cancel anytime
          </p>
        </Reveal>

        <Reveal delay={150}>
          <TransformCard />
        </Reveal>
      </div>
    </section>
  );
}

function TransformCard() {
  return (
    <div className="relative mx-auto w-full max-w-[19rem] md:max-w-[17rem] lg:max-w-[19rem]">
      <div className="absolute -inset-6 -z-10 rounded-[32px] bg-gradient-to-br from-accent/20 via-transparent to-accent-2/20 blur-2xl" />

      <div className="rounded-2xl border border-border bg-surface p-3.5 shadow-2xl shadow-black/40 md:p-3.5">
        <div className="flex items-center justify-between text-xs text-fg-subtle">
          <span>Product photo</span>
          <span>Input</span>
        </div>
        <div className="mt-2.5 flex h-16 items-center justify-center rounded-xl border border-dashed border-border-strong bg-bg-elevated md:h-14">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M9 4h6l1.5 2H20a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3.5L9 4Z"
              stroke="currentColor"
              strokeWidth="1.4"
              className="text-fg-subtle"
            />
            <circle
              cx="12"
              cy="13"
              r="3.4"
              stroke="currentColor"
              strokeWidth="1.4"
              className="text-fg-subtle"
            />
          </svg>
        </div>

        <div className="my-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] uppercase tracking-widest text-accent">
            Backlot AI
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="flex items-center justify-between text-xs text-fg-subtle">
          <span>Rendered ad</span>
          <span>Output</span>
        </div>
        <div className="relative mt-2.5 aspect-[9/10] overflow-hidden rounded-xl bg-gradient-to-b from-[#2a2118] via-[#181214] to-[#0c0b0d] md:aspect-[9/11]">
          <div className="absolute inset-0 opacity-40 bg-grid" />
          <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
            <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white/80">
              REC
            </span>
            <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white/80">
              0:14
            </span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur md:h-12 md:w-12">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7L8 5Z" />
              </svg>
            </div>
          </div>
          <div className="absolute inset-x-3 bottom-3 rounded-lg bg-black/50 p-2 backdrop-blur">
            <p className="text-[11px] leading-snug text-white">
              &ldquo;Here&rsquo;s why this one&rsquo;s different
              &mdash;&rdquo;
            </p>
            <div className="mt-1.5 h-1 w-3/4 rounded-full bg-white/25" />
          </div>
        </div>
      </div>
    </div>
  );
}
