import { NextResponse } from "next/server";
import { dodo, PLANS, planForProductId } from "@/lib/dodo/client";
import { createAdminClient } from "@/lib/supabase/admin";

// Dodo webhooks arrive with no logged-in session, so this route uses the
// service-role client. The claim (idempotency) and the profile update happen
// together inside apply_dodo_subscription_event(), so a failed write rolls
// the claim back and Dodo's retry can process the event again.

type SubscriptionPayload = {
  metadata?: Record<string, string>;
  customer?: { customer_id?: string; email?: string };
  product_id?: string;
  subscription_id?: string;
  cancel_at_next_billing_date?: boolean;
};

type Update = {
  plan: string | null;
  status: string | null;
  credits: number | null;
};

function updateFor(type: string, data: SubscriptionPayload): Update | null {
  switch (type) {
    case "subscription.active":
    case "subscription.renewed": {
      const planId = data.product_id ? planForProductId(data.product_id) : null;
      if (!planId) return null;
      return { plan: planId, status: "active", credits: PLANS[planId].monthlyCredits };
    }
    case "subscription.on_hold":
      return { plan: null, status: "on_hold", credits: null };
    case "subscription.cancelled":
      // Cancel-at-period-end keeps the plan until subscription.expired fires.
      return data.cancel_at_next_billing_date
        ? { plan: null, status: "cancelled", credits: null }
        : { plan: "free", status: "cancelled", credits: null };
    case "subscription.expired":
    case "subscription.failed":
      return { plan: "free", status: "expired", credits: null };
    default:
      return null;
  }
}

export async function POST(req: Request) {
  const raw = await req.text();
  const webhookId = req.headers.get("webhook-id");
  const signature = req.headers.get("webhook-signature");
  const timestamp = req.headers.get("webhook-timestamp");

  if (!webhookId || !signature || !timestamp) {
    return NextResponse.json({ error: "Missing webhook headers." }, { status: 400 });
  }

  let event;
  try {
    event = dodo.webhooks.unwrap(raw, {
      headers: {
        "webhook-id": webhookId,
        "webhook-signature": signature,
        "webhook-timestamp": timestamp,
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const data = event.data as SubscriptionPayload;
  const update = updateFor(event.type, data);
  if (!update) {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const supabase = createAdminClient();
  const { data: outcome, error } = await supabase.rpc("apply_dodo_subscription_event", {
    p_webhook_id: webhookId,
    p_event_type: event.type,
    p_user_id: data.metadata?.supabase_user_id ?? null,
    p_customer_id: data.customer?.customer_id ?? null,
    p_email: data.customer?.email ?? null,
    p_subscription_id: data.subscription_id ?? null,
    p_plan: update.plan,
    p_status: update.status,
    p_credits: update.credits,
  });

  if (error) {
    // Non-2xx makes Dodo retry; the transaction already rolled back the claim.
    console.error("Dodo webhook apply failed", event.type, error.message);
    return NextResponse.json({ error: "Could not apply event." }, { status: 500 });
  }

  if (outcome === "unmatched") {
    console.error("Dodo webhook matched no user", event.type, webhookId);
  }

  return NextResponse.json({ received: true, outcome });
}
