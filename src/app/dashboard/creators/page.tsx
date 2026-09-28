import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your creators",
  alternates: { canonical: "/dashboard/creators" },
};

const TRAINING_LABEL: Record<string, string> = {
  uploading: "Uploading…",
  training: "Training…",
  ready: "Ready",
  failed: "Failed",
};

const CONSENT_LABEL: Record<string, string> = {
  not_started: "Consent not started",
  pending: "Awaiting consent",
  approved: "Consent approved",
  declined: "Consent declined",
};

export default async function CreatorsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/creators");

  const { data: avatars } = await supabase
    .from("custom_avatars")
    .select("id, name, training_status, consent_status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">
            Your creators
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Custom AI creators trained from your own footage.
          </p>
        </div>
        <Link
          href="/dashboard/creators/new"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition-transform hover:scale-[1.02]"
        >
          New creator
        </Link>
      </div>

      {!avatars || avatars.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-dashed border-border-strong p-12 text-center">
          <p className="text-fg-muted">
            No custom creators yet — the picker on new ads uses stock
            creators until you train your own.
          </p>
        </div>
      ) : (
        <ul className="mt-10 divide-y divide-border border-t border-border">
          {avatars.map((a) => (
            <li key={a.id}>
              <Link
                href={`/dashboard/creators/${a.id}`}
                className="flex items-center justify-between gap-4 py-5 transition-colors hover:opacity-80"
              >
                <p className="font-medium">{a.name}</p>
                <div className="flex gap-2">
                  <span className="rounded-full border border-border-strong px-3 py-1 text-xs text-fg-muted">
                    {TRAINING_LABEL[a.training_status] ?? a.training_status}
                  </span>
                  {a.training_status === "ready" && (
                    <span className="rounded-full border border-border-strong px-3 py-1 text-xs text-fg-muted">
                      {CONSENT_LABEL[a.consent_status] ?? a.consent_status}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
