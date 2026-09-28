import Link from "next/link";
import Reveal from "@/components/Reveal";

export default function FinalCTA() {
  return (
    <section className="border-t border-border bg-bg-elevated py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <h2 className="text-balance font-display text-4xl leading-tight tracking-tight md:text-5xl">
            Your next ad campaign is one photo away.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-fg-muted">
            Start free, generate your first ad in minutes, and see why teams
            are replacing shoot days with Backlot.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-fg transition-transform hover:scale-[1.03]"
            >
              Start creating — free
            </Link>
            <a
              href="#pricing"
              className="rounded-full border border-border-strong px-6 py-3 text-sm font-medium text-fg transition-colors hover:bg-surface"
            >
              View pricing
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
