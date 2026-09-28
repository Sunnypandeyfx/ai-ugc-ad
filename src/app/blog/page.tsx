import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Blog",
  description: "Guides and updates on AI ad creative from the Backlot team.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <>
      <PageHeader
        eyebrow="Blog"
        title="Notes on AI ad creative"
        description="We're just getting started — first posts are coming soon."
      />
      <div className="mx-auto max-w-2xl px-6 py-20 text-center text-fg-muted">
        <p>No posts yet. Check back soon.</p>
      </div>
    </>
  );
}
