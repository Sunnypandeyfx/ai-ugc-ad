import Link from "next/link";
import Reveal from "@/components/Reveal";
import AbstractArt from "@/components/AbstractArt";

const STYLES = [
  { name: "Cinematic", blurb: "Emotive and premium" },
  { name: "UGC style", blurb: "Authentic and relatable" },
  { name: "Product demo", blurb: "Show it in action" },
  { name: "Lifestyle", blurb: "Real moments, real settings" },
  { name: "Bold & graphic", blurb: "Stand out anywhere" },
  { name: "Cinematic text", blurb: "Turn words into a hook" },
];

export default function StyleGallery() {
  return (
    <section className="border-b border-border bg-bg-elevated py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-accent-pink">A universe of creative possibilities</p>
              <h2 className="text-balance mt-3 max-w-xl font-display text-3xl leading-tight tracking-tight md:text-4xl">
                Generate any style. For any platform.
              </h2>
            </div>
            <Link
              href="/examples"
              className="shrink-0 rounded-full border border-border-strong px-4 py-2 text-sm text-fg-muted transition-colors hover:text-fg"
            >
              Explore more styles →
            </Link>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {STYLES.map((style, i) => (
            <Reveal key={style.name} delay={i * 60}>
              <figure>
                <AbstractArt index={i} className="aspect-[3/4]" />
                <figcaption className="mt-2.5">
                  <p className="text-sm font-medium">{style.name}</p>
                  <p className="text-xs text-fg-subtle">{style.blurb}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-xs text-fg-subtle">
          Illustrative style directions — your dashboard renders real cuts from your own product photos.
        </p>
      </div>
    </section>
  );
}
