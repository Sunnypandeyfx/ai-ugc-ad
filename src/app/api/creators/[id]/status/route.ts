import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvatarLookStatus, getAvatarGroupConsentStatus } from "@/lib/heygen/client";

const CONSENT_STATUSES = new Set(["not_started", "pending", "approved", "declined"]);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // Read through the user's session so RLS proves ownership.
  const { data: avatar, error } = await supabase
    .from("custom_avatars")
    .select("id, heygen_look_id, heygen_group_id, training_status, consent_status, error")
    .eq("id", id)
    .single();

  if (error || !avatar) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const admin = createAdminClient();

  if (avatar.training_status === "training" && avatar.heygen_look_id) {
    const look = await getAvatarLookStatus(avatar.heygen_look_id);
    if (look.status === "completed") {
      await admin
        .from("custom_avatars")
        .update({ training_status: "ready" })
        .eq("id", id)
        .eq("user_id", user.id);
      avatar.training_status = "ready";
    } else if (look.status === "failed") {
      await admin
        .from("custom_avatars")
        .update({ training_status: "failed", error: look.errorMessage })
        .eq("id", id)
        .eq("user_id", user.id);
      avatar.training_status = "failed";
      avatar.error = look.errorMessage;
    }
  }

  if (avatar.consent_status === "pending" && avatar.heygen_group_id) {
    const consentStatus = await getAvatarGroupConsentStatus(avatar.heygen_group_id);
    if (
      consentStatus &&
      CONSENT_STATUSES.has(consentStatus) &&
      consentStatus !== avatar.consent_status
    ) {
      await admin
        .from("custom_avatars")
        .update({ consent_status: consentStatus })
        .eq("id", id)
        .eq("user_id", user.id);
      avatar.consent_status = consentStatus;
    }
  }

  return NextResponse.json({
    training_status: avatar.training_status,
    consent_status: avatar.consent_status,
    error: avatar.error,
  });
}
