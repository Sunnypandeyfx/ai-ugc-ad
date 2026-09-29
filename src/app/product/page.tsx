import type { Metadata } from "next";
import Features from "@/components/sections/Features";

export const metadata: Metadata = {
  title: "Product",
  description:
    "AI UGC creators, cinematic commercials, on-brand generation, and multi-platform exports — everything Backlot gives your ad team.",
  alternates: { canonical: "/product" },
};

export default function ProductPage() {
  return <Features />;
}
