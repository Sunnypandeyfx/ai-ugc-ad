import type { Metadata } from "next";
import FAQ, { FAQ_ITEMS } from "@/components/sections/FAQ";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about Backlot's AI UGC ads and cinematic commercials, pricing, formats, and branding.",
  alternates: { canonical: "/faq" },
};

export default function FAQPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <FAQ />
    </>
  );
}
