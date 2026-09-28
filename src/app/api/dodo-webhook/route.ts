import { NextResponse } from "next/server";
import { dodo, PLANS, planForProductId } from "@/lib/dodo/client";
import { createAdminClient } from "@/lib/supabase/admin";

// Dodo webhooks arrive with no logged-in session, so this route uses the
// service-role client (bypasses RLS) rather than the per-user server client
// used everywhere else in this app.

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

  const supabase = createAdminClient();

  // Idempotency: claim this webhook-id before doing any writes. If it's
  // already claimed, this is a Dodo retry of an event we already processed.
  const { error: claimError } = await supabase
    .from("dodo_webhook_log")
    .insert({ webhook_id: webhookId, event_type: event.type });

  if (claimError) {
    // Unique-constraint violation = already processed. Any other DB error
    // should make Dodo retry, so surface it as a failure.
    if (claimError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    return NextResponse.json({ error: claimError.message }, { status: 503 });
  }

  const data = event.data as {
    metadata?: Record<string, string>;
    customer?: { customer_id?: string };
    product_id?: string;
    subscription_id?: string;
    cancel_at_next_billing_date?: boolean;
  };

  const supabaseUserId = data.metadata?.supabase_user_id;
  const customerId = data.customer?.customer_id;

  async function findUserId(): Promise<string | null> {
    if (supabaseUserId) return supabaseUserId;
    if (!customerId) return null;
    const { data: row } = await supabase
      .from("profiles")
      .select("id")
      .eq("dodo_customer_id", customerId)
      .single();
    return row?.id ?? null;
  }

  switch (event.type) {
    case "subscription.active":
    case "subscription.renewed": {
      const userId = await findUserId();
      const planId = data.product_id ? planForProductId(data.product_id) : null;
      if (userId && planId) {
        await supabase
          .from("profiles")
          .update({
            plan: planId,
            dodo_customer_id: customerId ?? undefined,
            dodo_subscription_id: data.subscription_id ?? undefined,
            subscription_status: "active",
            credits_remaining: PLANS[planId].monthlyCredits,
          })
          .eq("id", userId);
      }
      break;
    }

    case "subscription.on_hold": {
      const userId = await findUserId();
      if (userId) {
        await supabase
          .from("profiles")
          .update({ subscription_status: "on_hold" })
          .eq("id", userId);
      }
      break;
    }

    case "subscription.cancelled": {
      const userId = await findUserId();
      if (userId && !data.cancel_at_next_billing_date) {
        await supabase
          .from("profiles")
          .update({ subscription_status: "cancelled", plan: "free" })
          .eq("id", userId);
      } else if (userId) {
        await supabase
          .from("profiles")
          .update({ subscription_status: "cancelled" })
          .eq("id", userId);
      }
      break;
    }

    case "subscription.expired":
    case "subscription.failed": {
      const userId = await findUserId();
      if (userId) {
        await supabase
          .from("profiles")
          .update({ subscription_status: "expired", plan: "free" })
          .eq("id", userId);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
