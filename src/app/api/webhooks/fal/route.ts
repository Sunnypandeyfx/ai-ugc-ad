import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyFalWebhook } from "@/lib/providers/video/falWebhook";

// fal.ai calls this when a queued generation finishes. Verified against
// fal's docs: headers carry an Ed25519 signature over
// `${requestId}\n${userId}\n${timestamp}\n${sha256hex(rawBody)}`, checked
// against https://rest.fal.ai/.well-known/jwks.json. See
// src/lib/providers/video/falWebhook.ts for the exact verification.
export async function POST(req: Request) {
  const rawBody = await req.text();
  const verified = await verifyFalWebhook(rawBody, {
    requestId: req.headers.get("x-fal-webhook-request-id"),
    userId: req.headers.get("x-fal-webhook-user-id"),
    timestamp: req.headers.get("x-fal-webhook-timestamp"),
    signature: req.headers.get("x-fal-webhook-signature"),
  });
  if (!verified) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: { request_id?: string; status?: string; payload?: { video?: { url?: string } }; error?: string };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const requestId = payload.request_id;
  if (!requestId) return NextResponse.json({ error: "Missing request id." }, { status: 400 });

  const admin = createAdminClient();
  const { data: job } = await admin
    .from("generation_jobs")
    .select("id")
    .eq("provider", "fal")
    .eq("provider_job_id", requestId)
    .maybeSingle();

  // Unknown request id: acknowledge so fal doesn't retry forever, but there
  // is nothing of ours to update.
  if (!job) return NextResponse.json({ received: true, matched: false });

  const ok = payload.status !== "ERROR";
  const { error: rpcError } = await admin.rpc("finalize_shot_generation", {
    p_job_id: job.id,
    p_webhook_request_id: requestId,
    p_status: ok ? "ready" : "failed",
    p_video_url: ok ? (payload.payload?.video?.url ?? null) : null,
    p_error: ok ? null : (payload.error ?? "Generation failed."),
  });
  if (rpcError) {
    console.error("fal webhook finalize failed", requestId, rpcError);
    return NextResponse.json({ error: "Could not apply result." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
