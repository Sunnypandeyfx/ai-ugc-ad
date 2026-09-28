import Reveal from "@/components/Reveal";

export const FAQ_ITEMS = [
  {
    q: "What's the difference between a UGC ad and a cinematic commercial?",
    a: "A UGC ad features an AI creator speaking to camera in an authentic, testimonial style — built for TikTok and Reels feeds. A cinematic commercial is a produced, dialogue-free scene showing your product in a studio-quality setting, closer to a traditional brand spot.",
  },
  {
    q: "Do I need any filming or editing experience?",
    a: "No. You upload product photos and answer a few questions about your audience and goals. Backlot handles the script, the shoot, and the edit.",
  },
  {
    q: "Can I keep my brand's look consistent across ads?",
    a: "Yes. Set your colors, fonts, and tone once in a brand kit, and every ad you generate afterward stays on-brand automatically.",
  },
  {
    q: "What formats and aspect ratios do you export?",
    a: "Every render includes vertical (9:16), square (1:1), and widescreen (16:9) cuts, so you're covered for TikTok, Reels, Shorts, and YouTube without re-exporting.",
  },
  {
    q: "How does the subscription and credits work?",
    a: "Each plan includes a monthly allowance of final ad renders. Script drafts and revisions are unlimited — credits are only used when you render a finished video.",
  },
  {
    q: "Can I change or cancel my plan anytime?",
    a: "Yes, you can upgrade, downgrade, or cancel from your billing settings at any time. Changes apply at the start of your next billing cycle.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal>
          <p className="text-center text-sm font-medium text-accent">FAQ</p>
          <h2 className="text-balance mx-auto mt-3 text-center font-display text-4xl leading-tight tracking-tight md:text-5xl">
            Questions, answered.
          </h2>
        </Reveal>

        <div className="mt-14 divide-y divide-border border-t border-border">
          {FAQ_ITEMS.map((item, i) => (
            <Reveal key={item.q} delay={i * 60}>
              <details className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-medium text-fg">
                  {item.q}
                  <span className="shrink-0 text-fg-subtle transition-transform group-open:rotate-45">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 5v14M5 12h14"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted">
                  {item.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
