import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/dodo/client";
import PlanCard from "./PlanCard";
import ManageBillingButton from "./ManageBillingButton";

export const metadata: Metadata = {
  title: "Billing",
  alternates: { canonical: "/dashboard/billing" },
};

const FEATURES: Record<string, string[]> = {
  starter: ["UGC creators", "1 brand kit", "Standard render queue"],
  growth: ["UGC + cinematic", "3 brand kits", "Priority render queue"],
  agency: ["Unlimited brand kits", "Dedicated render queue", "Team seats"],
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/billing");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, subscription_status, credits_remaining, dodo_customer_id")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-3xl tracking-tight">Billing</h1>

      {checkout === "success" && (
        <div className="mt-4 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm text-fg">
          Payment received — your plan updates within a few seconds once the
          webhook confirms it. Refresh if it doesn&rsquo;t appear right away.
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5">
        <div>
          <p className="text-sm text-fg-muted">Current plan</p>
          <p className="mt-1 text-lg font-medium capitalize">
            {profile?.plan ?? "free"}{" "}
            <span className="text-sm font-normal text-fg-subtle">
              ({profile?.subscription_status ?? "none"})
            </span>
          </p>
          <p className="mt-1 text-sm text-fg-muted">
            {profile?.credits_remaining ?? 0} renders remaining
          </p>
        </div>
        {profile?.dodo_customer_id && <ManageBillingButton />}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <PlanCard
          planId="starter"
          name={PLANS.starter.name}
          priceUsd={PLANS.starter.priceUsd}
          credits={PLANS.starter.monthlyCredits}
          features={FEATURES.starter}
          currentPlan={profile?.plan ?? "free"}
        />
        <PlanCard
          planId="growth"
          name={PLANS.growth.name}
          priceUsd={PLANS.growth.priceUsd}
          credits={PLANS.growth.monthlyCredits}
          features={FEATURES.growth}
          currentPlan={profile?.plan ?? "free"}
          highlighted
        />
        <PlanCard
          planId="agency"
          name={PLANS.agency.name}
          priceUsd={PLANS.agency.priceUsd}
          credits={PLANS.agency.monthlyCredits}
          features={FEATURES.agency}
          currentPlan={profile?.plan ?? "free"}
        />
      </div>
    </div>
  );
}
