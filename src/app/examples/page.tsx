import type { Metadata } from "next";
import Showcase from "@/components/sections/Showcase";

export const metadata: Metadata = {
  title: "Examples",
  description:
    "See example UGC ads and cinematic commercials Backlot can generate from a single product photo.",
  alternates: { canonical: "/examples" },
};

export default function ExamplesPage() {
  return <Showcase />;
}
