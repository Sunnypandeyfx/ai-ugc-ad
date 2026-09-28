import Link from "next/link";
import Reveal from "@/components/Reveal";

const PLANS = [
  {
    name: "Starter",
    price: "$49",
    blurb: "For solo founders testing their first AI ad creative.",
    features: [
      "10 ad generations / month",
      "UGC creators",
      "1 brand kit",
      "Standard render queue",
      "720p & 1080p exports",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$149",
    blurb: "For teams running always-on paid creative.",
    features: [
      "40 ad generations / month",
      "UGC creators + cinematic scenes",
      "3 brand kits",
      "Priority render queue",
      "Auto platform cuts (TikTok, Reels, YouTube)",
    ],
    cta: "Start free",
    highlighted: true,
  },
  {
    name: "Agency",
    price: "$399",
    blurb: "For agencies producing creative across many clients.",
    features: [
      "150 ad generations / month",
      "Unlimited brand kits",
      "Dedicated render queue",
      "Team seats & approvals",
      "White-label exports",
    ],
    cta: "Talk to sales",
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="border-b border-border bg-bg-elevated py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="text-center">
          <p className="text-sm font-medium text-accent">Pricing</p>
          <h2 className="text-balance mx-auto mt-3 max-w-xl font-display text-4xl leading-tight tracking-tight md:text-5xl">
            Simple plans. Cancel anytime.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-fg-muted">
            Every plan includes unlimited script drafts — you only spend
            credits when you render a final ad.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 100}>
              <div
                className={`flex h-full flex-col rounded-2xl border p-8 ${
                  plan.highlighted
                    ? "border-accent bg-surface shadow-xl shadow-accent/10"
                    : "border-border bg-surface"
                }`}
              >
                {plan.highlighted && (
                  <span className="mb-4 inline-flex w-fit items-center rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-medium">{plan.name}</h3>
                <p className="mt-1 text-sm text-fg-muted">{plan.blurb}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-4xl tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-sm text-fg-subtle">/ month</span>
                </div>

                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-sm text-fg-muted"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="mt-0.5 shrink-0 text-accent"
                      >
                        <path
                          d="M5 12.5 10 17l9-10"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`mt-8 rounded-full px-5 py-3 text-center text-sm font-medium transition-colors ${
                    plan.highlighted
                      ? "bg-accent text-accent-fg hover:opacity-90"
                      : "border border-border-strong text-fg hover:bg-surface-2"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-fg-subtle">
          Need more volume than Agency covers?{" "}
          <Link href="/contact" className="text-fg underline underline-offset-4">
            Talk to us
          </Link>{" "}
          about a custom plan.
        </p>
      </div>
    </section>
  );
}
