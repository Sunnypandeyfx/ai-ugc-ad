import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
  alternates: { canonical: "/dashboard" },
};

const STATUS_LABEL: Record<string, string> = {
  queued: "Generating…",
  script_ready: "Script ready",
  failed: "Failed",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_remaining")
    .eq("id", user.id)
    .single();

  const { data: generations } = await supabase
    .from("generations")
    .select("id, ad_type, platform, status, created_at, products(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Your ads</h1>
          <p className="mt-1 text-sm text-fg-muted">{user.email}</p>
          <Link
            href="/dashboard/creators"
            className="mt-2 inline-block text-xs text-fg-muted underline underline-offset-4 hover:text-fg"
          >
            My creators
          </Link>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link
            href="/dashboard/new"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition-transform hover:scale-[1.02]"
          >
            New ad
          </Link>
          {profile && (
            <span className="text-xs text-fg-subtle">
              {profile.credits_remaining} free render
              {profile.credits_remaining === 1 ? "" : "s"} left
            </span>
          )}
        </div>
      </div>

      {!generations || generations.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-dashed border-border-strong p-12 text-center">
          <p className="text-fg-muted">
            No ads yet. Upload a product to generate your first script.
          </p>
          <Link
            href="/dashboard/new"
            className="mt-6 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg"
          >
            Create your first ad
          </Link>
        </div>
      ) : (
        <ul className="mt-10 divide-y divide-border border-t border-border">
          {generations.map((g) => (
            <li key={g.id}>
              <Link
                href={`/dashboard/${g.id}`}
                className="flex items-center justify-between gap-4 py-5 transition-colors hover:opacity-80"
              >
                <div>
                  <p className="font-medium">
                    {(g.products as unknown as { name: string } | null)?.name ??
                      "Untitled product"}
                  </p>
                  <p className="mt-1 text-xs text-fg-subtle">
                    {g.ad_type === "ugc" ? "UGC" : "Cinematic"} ·{" "}
                    {g.platform} ·{" "}
                    {new Date(g.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="rounded-full border border-border-strong px-3 py-1 text-xs text-fg-muted">
                  {STATUS_LABEL[g.status] ?? g.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
