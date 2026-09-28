import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Backlot team.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Talk to us"
        description="For sales, support, or partnership questions, reach out and we'll get back to you within one business day."
      />
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <a
          href="mailto:hello@backlot.ai"
          className="text-lg font-medium text-fg underline underline-offset-4"
        >
          hello@backlot.ai
        </a>
        <p className="mt-4 text-sm text-fg-muted">
          Agency or enterprise volume? Mention it in your email and we&rsquo;ll
          set up a custom plan.
        </p>
      </div>
    </>
  );
}
