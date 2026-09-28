import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initDirectUpload } from "@/lib/heygen/client";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { filename, contentType, sizeBytes } = await req.json();

  if (!filename || !sizeBytes) {
    return NextResponse.json({ error: "Missing file info." }, { status: 400 });
  }
  if (sizeBytes > 200 * 1024 * 1024) {
    return NextResponse.json({ error: "Video is too large (max 200MB)." }, { status: 400 });
  }

  try {
    const init = await initDirectUpload({
      filename,
      contentType: contentType || "video/mp4",
      sizeBytes,
    });
    return NextResponse.json(init);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload init failed." },
      { status: 502 },
    );
  }
}
