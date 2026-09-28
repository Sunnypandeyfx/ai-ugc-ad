import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { completeDirectUpload } from "@/lib/heygen/client";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { assetId } = await req.json();
  if (!assetId) {
    return NextResponse.json({ error: "Missing assetId." }, { status: 400 });
  }

  try {
    await completeDirectUpload(assetId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload finalize failed." },
      { status: 502 },
    );
  }
}
