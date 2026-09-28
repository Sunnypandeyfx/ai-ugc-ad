import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "About",
  description:
    "Backlot builds AI tools that turn a single product photo into UGC ads and cinematic commercials, so any brand can produce studio-quality creative without a shoot.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="Ad production, rebuilt around AI."
        description="Backlot exists because shooting creative shouldn't be the bottleneck between a good product and a good ad."
      />
      <div className="mx-auto max-w-2xl px-6 py-20 text-fg-muted">
        <p className="leading-relaxed">
          Traditional ad production means booking talent, renting a studio,
          and waiting days for a single cut. Backlot compresses that into
          minutes: upload a product photo, and our AI pipeline writes the
          script, generates the performance or scene, and delivers
          platform-ready exports.
        </p>
        <p className="mt-6 leading-relaxed">
          We&rsquo;re building for the teams who used to skip paid creative
          testing because production couldn&rsquo;t keep up with their
          ad spend — and for solo founders who never had a production
          budget at all.
        </p>
      </div>
    </>
  );
}
