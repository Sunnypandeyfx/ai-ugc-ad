"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { PublicAvatar } from "@/lib/heygen/client";
import { createClient } from "@/lib/supabase/client";
import { createGeneration, type CreateGenerationState } from "./actions";

export type PickerAvatar = PublicAvatar & {
  category: "female" | "male" | "custom";
};

const initialState: CreateGenerationState = { error: null };

const FILTERS: { key: "all" | "female" | "male" | "custom"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "female", label: "Female" },
  { key: "male", label: "Male" },
  { key: "custom", label: "My creators" },
];

function AddCreatorTile() {
  return (
    <Link
      href="/dashboard/creators/new"
      className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-blue-500/60 text-blue-500 transition-colors hover:border-blue-500 hover:bg-blue-500/10"
      title="Upload or generate a creator"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 5v14M5 12h14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-center text-[10px] leading-tight">
        Upload your own
      </span>
    </Link>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="mt-2 w-full rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-fg transition-transform hover:scale-[1.02] disabled:opacity-60"
    >
      {pending ? "Writing your script…" : "Generate script"}
    </button>
  );
}

export default function NewGenerationForm({
  avatars,
  userId,
}: {
  avatars: PickerAvatar[];
  userId: string;
}) {
  const [state, formAction] = useActionState(createGeneration, initialState);
  const [adType, setAdType] = useState<"ugc" | "cinematic">("ugc");
  const [selectedAvatar, setSelectedAvatar] = useState<PickerAvatar | null>(
    avatars[0] ?? null,
  );
  const [avatarFilter, setAvatarFilter] = useState<
    "all" | "female" | "male" | "custom"
  >("all");
  const visibleAvatars =
    avatarFilter === "all"
      ? avatars
      : avatars.filter((a) => a.category === avatarFilter);
  type PendingImage = {
    id: string;
    previewUrl: string;
    path: string | null;
    uploading: boolean;
  };
  const [images, setImages] = useState<PendingImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const uploadingImages = images.some((img) => img.uploading);

  async function handleImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow picking the same file again later
    if (files.length === 0) return;

    setImageError(null);
    const newImages: PendingImage[] = files.map((file) => ({
      id: crypto.randomUUID(),
      previewUrl: URL.createObjectURL(file),
      path: null,
      uploading: true,
    }));
    setImages((prev) => [...prev, ...newImages]);

    const supabase = createClient();
    await Promise.all(
      files.map(async (file, i) => {
        const entry = newImages[i];
        try {
          const path = `${userId}/${crypto.randomUUID()}-${file.name}`;
          const { error } = await supabase.storage
            .from("product-images")
            .upload(path, file);
          if (error) throw error;
          setImages((prev) =>
            prev.map((img) =>
              img.id === entry.id ? { ...img, path, uploading: false } : img,
            ),
          );
        } catch (err) {
          setImageError(err instanceof Error ? err.message : "Image upload failed.");
          setImages((prev) => prev.filter((img) => img.id !== entry.id));
        }
      }),
    );
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  }

  return (
    <form action={formAction} className="mt-10 space-y-5">
      <div>
        <label htmlFor="name" className="text-xs text-fg-muted">
          Product name
        </label>
        <input
          id="name"
          name="name"
          required
          className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
          placeholder="Glow Serum"
        />
      </div>

      <div>
        <label htmlFor="description" className="text-xs text-fg-muted">
          Product description
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={3}
          className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
          placeholder="A vitamin C serum that brightens skin in 2 weeks, cruelty-free, for daily use."
        />
      </div>

      <div>
        <label htmlFor="images" className="text-xs text-fg-muted">
          Product photos (optional, add as many angles as you have)
        </label>
        <input
          id="images"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImagesChange}
          className="mt-1.5 w-full rounded-lg border border-dashed border-border-strong bg-surface px-3 py-2.5 text-sm text-fg-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-xs file:text-fg"
        />
        {images.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {images.map((img) => (
              <div key={img.id} className="group relative h-16 w-16">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.previewUrl}
                  alt=""
                  className={`h-16 w-16 rounded-lg object-cover ${img.uploading ? "opacity-50" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  aria-label="Remove photo"
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-bg text-xs text-fg-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-fg"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        {uploadingImages && (
          <p className="mt-2 text-xs text-fg-subtle">Uploading photos…</p>
        )}
        {imageError && <p className="mt-2 text-xs text-red-400">{imageError}</p>}
        {images
          .filter((img) => img.path)
          .map((img) => (
            <input key={img.id} type="hidden" name="imagePaths" value={img.path!} />
          ))}
      </div>

      <div>
        <label htmlFor="audience" className="text-xs text-fg-muted">
          Target audience
        </label>
        <input
          id="audience"
          name="audience"
          required
          className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
          placeholder="Women 25-40 interested in clean skincare"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="platform" className="text-xs text-fg-muted">
            Platform
          </label>
          <select
            id="platform"
            name="platform"
            defaultValue="TikTok"
            className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
          >
            <option>TikTok</option>
            <option>Instagram Reels</option>
            <option>YouTube Shorts</option>
            <option>Paid feed</option>
          </select>
        </div>

        <div>
          <label htmlFor="adType" className="text-xs text-fg-muted">
            Ad type
          </label>
          <select
            id="adType"
            name="adType"
            value={adType}
            onChange={(e) => setAdType(e.target.value as "ugc" | "cinematic")}
            className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
          >
            <option value="ugc">UGC creator</option>
            <option value="cinematic">Cinematic</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="duration" className="text-xs text-fg-muted">
          Duration
        </label>
        <select
          id="duration"
          name="duration"
          defaultValue="30"
          className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        >
          <option value="15">15 seconds</option>
          <option value="30">30 seconds</option>
          <option value="45">45 seconds</option>
          <option value="60">60 seconds</option>
        </select>
      </div>

      <div>
        <label htmlFor="tone" className="text-xs text-fg-muted">
          Tone (optional)
        </label>
        <input
          id="tone"
          name="tone"
          className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
          placeholder="Playful and confident"
        />
      </div>

      {adType === "ugc" && (
        <div>
          <p className="text-xs text-fg-muted">Choose a creator</p>
          {avatars.length === 0 ? (
            <p className="mt-2 text-xs text-fg-subtle">
              No creators available — video rendering isn&rsquo;t configured
              yet. You can still generate a script.
            </p>
          ) : (
            <>
              <div className="mt-2 flex gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setAvatarFilter(f.key)}
                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                      avatarFilter === f.key
                        ? "bg-accent text-accent-fg"
                        : "border border-border-strong text-fg-muted hover:text-fg"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {visibleAvatars.length === 0 ? (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  <AddCreatorTile />
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {visibleAvatars.map((avatar) => {
                    const isSelected = selectedAvatar?.id === avatar.id;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                          isSelected
                            ? "border-blue-500 ring-2 ring-blue-500 ring-offset-2 ring-offset-bg"
                            : "border-transparent opacity-80 hover:opacity-100"
                        }`}
                        title={avatar.name}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={avatar.preview_image_url ?? ""}
                          alt={avatar.name}
                          className="aspect-square w-full object-cover"
                        />
                        {isSelected && (
                          <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M5 12.5 10 17l9-10"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {avatarFilter === "custom" && <AddCreatorTile />}
                </div>
              )}
            </>
          )}
          <input type="hidden" name="avatarId" value={selectedAvatar?.id ?? ""} />
          <input
            type="hidden"
            name="avatarName"
            value={selectedAvatar?.name ?? ""}
          />
          <input
            type="hidden"
            name="voiceId"
            value={selectedAvatar?.default_voice_id ?? ""}
          />
        </div>
      )}

      {state.error && <p className="text-xs text-red-400">{state.error}</p>}

      <SubmitButton disabled={uploadingImages} />
    </form>
  );
}
