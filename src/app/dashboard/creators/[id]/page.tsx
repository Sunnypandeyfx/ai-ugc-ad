import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreatorStatusPanel from "./CreatorStatusPanel";

export const metadata: Metadata = { title: "Creator" };

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/dashboard/creators/${id}`);

  const { data: avatar } = await supabase
    .from("custom_avatars")
    .select("id, name, source, training_status, consent_status, consent_url, error")
    .eq("id", id)
    .single();

  if (!avatar) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/dashboard/creators" className="text-sm text-fg-muted hover:text-fg">
        ← Back to creators
      </Link>

      <h1 className="mt-6 font-display text-3xl tracking-tight">{avatar.name}</h1>

      <CreatorStatusPanel
        customAvatarId={avatar.id}
        source={avatar.source as "digital_twin" | "prompt"}
        initialTrainingStatus={
          avatar.training_status as "uploading" | "training" | "ready" | "failed"
        }
        initialConsentStatus={
          avatar.consent_status as
            | "not_started"
            | "pending"
            | "approved"
            | "declined"
        }
        initialConsentUrl={avatar.consent_url}
        initialError={avatar.error}
      />
    </div>
  );
}
