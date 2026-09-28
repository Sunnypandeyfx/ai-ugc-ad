import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listPublicAvatars, type PublicAvatar } from "@/lib/heygen/client";
import NewGenerationForm from "./NewGenerationForm";

export const metadata: Metadata = {
  title: "New ad",
  alternates: { canonical: "/dashboard/new" },
};

async function getAvatars(): Promise<PublicAvatar[]> {
  if (!process.env.HEYGEN_API_KEY) return [];
  try {
    return await listPublicAvatars(12);
  } catch {
    return [];
  }
}

export default async function NewGenerationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/new");

  const avatars = await getAvatars();

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-display text-3xl tracking-tight">New ad</h1>
      <p className="mt-2 text-sm text-fg-muted">
        Tell us about the product. Backlot will draft a script, then you can
        render it with a UGC creator.
      </p>
      <NewGenerationForm avatars={avatars} />
    </div>
  );
}
