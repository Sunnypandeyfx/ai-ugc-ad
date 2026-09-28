import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  listPublicAvatars,
  getAvatarLookPreview,
  type PublicAvatar,
} from "@/lib/heygen/client";
import NewGenerationForm, { type PickerAvatar } from "./NewGenerationForm";

export const metadata: Metadata = {
  title: "New ad",
  alternates: { canonical: "/dashboard/new" },
};

async function getStockAvatars(): Promise<PickerAvatar[]> {
  if (!process.env.HEYGEN_API_KEY) return [];
  try {
    const avatars = await listPublicAvatars(30);
    return avatars.map((a: PublicAvatar) => ({
      ...a,
      category: a.gender === "male" ? "male" : "female",
    }));
  } catch {
    return [];
  }
}

async function getMyCreators(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<PickerAvatar[]> {
  const { data } = await supabase
    .from("custom_avatars")
    .select("heygen_look_id, name, voice_id")
    .eq("training_status", "ready")
    .eq("consent_status", "approved");

  if (!data || data.length === 0) return [];

  const withPreviews = await Promise.all(
    data.map(async (a) => {
      const { previewImageUrl } = await getAvatarLookPreview(a.heygen_look_id!);
      return {
        id: a.heygen_look_id!,
        name: `${a.name} (yours)`,
        gender: null,
        preview_image_url: previewImageUrl,
        default_voice_id: a.voice_id,
        category: "custom" as const,
      };
    }),
  );

  return withPreviews.filter((a) => a.preview_image_url);
}

export default async function NewGenerationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/new");

  const [myCreators, stockAvatars] = await Promise.all([
    getMyCreators(supabase),
    getStockAvatars(),
  ]);
  const avatars = [...myCreators, ...stockAvatars];

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-display text-3xl tracking-tight">New ad</h1>
      <p className="mt-2 text-sm text-fg-muted">
        Tell us about the product. Backlot will draft a script, then you can
        render it with a UGC creator.
      </p>
      <NewGenerationForm avatars={avatars} userId={user.id} />
      <p className="mt-6 text-xs text-fg-subtle">
        Don&rsquo;t see who you want?{" "}
        <Link href="/dashboard/creators/new" className="text-fg underline underline-offset-4">
          Add a custom or AI-generated creator
        </Link>
      </p>
    </div>
  );
}
