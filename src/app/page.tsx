import Hero from "@/components/sections/Hero";
import BuiltFor from "@/components/sections/BuiltFor";
import HowItWorks from "@/components/sections/HowItWorks";
import Features from "@/components/sections/Features";
import Showcase from "@/components/sections/Showcase";
import Pricing from "@/components/sections/Pricing";
import FAQ, { FAQ_ITEMS } from "@/components/sections/FAQ";
import FinalCTA from "@/components/sections/FinalCTA";

export default function Home() {
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
      <Hero />
      <BuiltFor />
      <HowItWorks />
      <Features />
      <Showcase />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </>
  );
}
