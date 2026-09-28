import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing use of Backlot.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms of Service" />
      <div className="mx-auto max-w-2xl px-6 py-20 text-sm leading-relaxed text-fg-muted">
        <p className="rounded-lg border border-border-strong bg-surface p-4 text-xs text-fg-subtle">
          Draft placeholder — replace with terms reviewed by counsel before
          this site goes live. It should cover subscription billing and
          cancellation, acceptable use of generated ads, ownership of
          content you upload versus content you generate, and limitation of
          liability for third-party AI provider outages.
        </p>
        <h2 className="mt-8 text-base font-medium text-fg">Subscriptions</h2>
        <p className="mt-2">
          Plans renew monthly until canceled. You can cancel anytime from
          billing settings; access continues until the end of the current
          billing period.
        </p>
        <h2 className="mt-8 text-base font-medium text-fg">
          Content ownership
        </h2>
        <p className="mt-2">
          You retain rights to the product images you upload. Ads generated
          from your uploads are yours to use, subject to your plan&rsquo;s
          usage terms.
        </p>
        <h2 className="mt-8 text-base font-medium text-fg">
          Acceptable use
        </h2>
        <p className="mt-2">
          You may not use Backlot to generate ads for products or claims
          that are illegal, deceptive, or infringe on others&rsquo; rights.
        </p>
      </div>
    </>
  );
}
