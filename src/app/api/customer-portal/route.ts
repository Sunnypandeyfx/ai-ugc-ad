import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dodo } from "@/lib/dodo/client";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("dodo_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.dodo_customer_id) {
    return NextResponse.json({ error: "No billing account yet." }, { status: 404 });
  }

  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  try {
    const portalSession = await dodo.customers.customerPortal.create(
      profile.dodo_customer_id,
      { return_url: `${origin}/dashboard/billing` },
    );
    return NextResponse.json({ portalUrl: portalSession.link });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not open billing portal." },
      { status: 502 },
    );
  }
}
