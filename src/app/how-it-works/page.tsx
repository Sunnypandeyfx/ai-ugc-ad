import type { Metadata } from "next";
import HowItWorks from "@/components/sections/HowItWorks";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "See how Backlot turns a product photo into a finished UGC ad or cinematic commercial in four steps — upload, script, shoot, and export.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  return <HowItWorks />;
}
