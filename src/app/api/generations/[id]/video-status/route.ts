import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVideoStatus } from "@/lib/heygen/client";

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

  const { data: generation, error } = await supabase
    .from("generations")
    .select("id, video_status, heygen_video_id, video_url, video_error")
    .eq("id", id)
    .single();

  if (error || !generation) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (generation.video_status !== "rendering" || !generation.heygen_video_id) {
    return NextResponse.json({
      video_status: generation.video_status,
      video_url: generation.video_url,
      video_error: generation.video_error,
    });
  }

  const heygenStatus = await getVideoStatus(generation.heygen_video_id);
  const admin = createAdminClient();

  if (heygenStatus.status === "completed") {
    await admin
      .from("generations")
      .update({ video_status: "ready", video_url: heygenStatus.videoUrl })
      .eq("id", id)
      .eq("user_id", user.id);
    return NextResponse.json({ video_status: "ready", video_url: heygenStatus.videoUrl });
  }

  if (heygenStatus.status === "failed") {
    await admin
      .from("generations")
      .update({
        video_status: "failed",
        video_error: heygenStatus.failureMessage ?? "Render failed.",
      })
      .eq("id", id)
      .eq("user_id", user.id);
    return NextResponse.json({
      video_status: "failed",
      video_error: heygenStatus.failureMessage,
    });
  }

  return NextResponse.json({ video_status: "rendering" });
}
