import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dodo, PLANS, type PlanId } from "@/lib/dodo/client";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { plan } = (await req.json()) as { plan?: PlanId };
  if (!plan || !PLANS[plan]) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  }

  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  try {
    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: PLANS[plan].productId, quantity: 1 }],
      customer: { email: user.email! },
      return_url: `${origin}/dashboard/billing?checkout=success`,
      metadata: { supabase_user_id: user.id, plan },
    });

    return NextResponse.json({ checkoutUrl: session.checkout_url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not start checkout." },
      { status: 502 },
    );
  }
}
