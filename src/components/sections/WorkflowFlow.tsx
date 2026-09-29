import Reveal from "@/components/Reveal";
import AbstractArt from "@/components/AbstractArt";
import { STEPS } from "@/lib/projects";

export default function WorkflowFlow() {
  return (
    <section id="workflow" className="border-b border-border bg-bg-elevated py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-sm font-medium text-accent-pink">From product to performance</p>
          <h2 className="text-balance mt-3 max-w-xl font-display text-3xl leading-tight tracking-tight md:text-4xl">
            A complete ad engine, in one flow.
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {STEPS.map((step, i) => (
            <Reveal key={step.key} delay={i * 60}>
              <div className="relative h-full rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-pink to-accent-2 text-[11px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <h3 className="text-sm font-medium">{step.label}</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-fg-muted">{step.blurb}</p>
                <AbstractArt index={i} className="mt-3 aspect-[4/3]" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
