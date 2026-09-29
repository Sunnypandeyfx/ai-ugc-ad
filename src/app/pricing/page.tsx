import type { Metadata } from "next";
import Link from "next/link";
import Pricing from "@/components/sections/Pricing";
import { CampaignArt } from "@/components/CampaignArt";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, subscription-based pricing for Backlot's AI UGC ads and cinematic commercials. Starter, Growth, and Agency plans — cancel anytime.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <>
      <Pricing />
      <section className="py-16">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 sm:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface p-6">
            <CampaignArt index={3} className="aspect-[21/9] rounded-lg" />
            <h3 className="mt-4 text-sm font-medium">Bring your own product.</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
              Build a brief around what makes it yours, then explore a creative direction with AI.
            </p>
            <Link
              href="/signup"
              className="mt-3 inline-block text-sm font-medium text-accent-pink underline underline-offset-4"
            >
              Start creating →
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="text-sm font-medium">A plan for your next chapter.</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
              Need help choosing? Tell us about your team and what you want to create.
            </p>
            <Link
              href="/contact"
              className="mt-3 inline-block text-sm font-medium text-accent-pink underline underline-offset-4"
            >
              Talk to us →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
