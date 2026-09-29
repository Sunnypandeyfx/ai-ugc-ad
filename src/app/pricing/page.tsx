import type { Metadata } from "next";
import Pricing from "@/components/sections/Pricing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, subscription-based pricing for Backlot's AI UGC ads and cinematic commercials. Starter, Growth, and Agency plans — cancel anytime.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return <Pricing />;
}
