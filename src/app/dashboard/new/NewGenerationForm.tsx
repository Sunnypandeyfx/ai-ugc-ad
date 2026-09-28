"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { PublicAvatar } from "@/lib/heygen/client";
import { createClient } from "@/lib/supabase/client";
import { createGeneration, type CreateGenerationState } from "./actions";

const initialState: CreateGenerationState = { error: null };

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
  avatars: PublicAvatar[];
  userId: string;
}) {
  const [state, formAction] = useActionState(createGeneration, initialState);
  const [adType, setAdType] = useState<"ugc" | "cinematic">("ugc");
  const [selectedAvatar, setSelectedAvatar] = useState<PublicAvatar | null>(
    avatars[0] ?? null,
  );
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  async function handleImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
    setImagePaths([]);
    setImageError(null);
    setUploadingImages(true);

    try {
      const supabase = createClient();
      const paths = await Promise.all(
        files.map(async (file) => {
          const path = `${userId}/${crypto.randomUUID()}-${file.name}`;
          const { error } = await supabase.storage
            .from("product-images")
            .upload(path, file);
          if (error) throw error;
          return path;
        }),
      );
      setImagePaths(paths);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploadingImages(false);
    }
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
        {imagePreviews.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {imagePreviews.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt=""
                className="h-16 w-16 rounded-lg object-cover"
              />
            ))}
          </div>
        )}
        {uploadingImages && (
          <p className="mt-2 text-xs text-fg-subtle">Uploading photos…</p>
        )}
        {imageError && <p className="mt-2 text-xs text-red-400">{imageError}</p>}
        {imagePaths.map((path) => (
          <input key={path} type="hidden" name="imagePaths" value={path} />
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
            <div className="mt-2 grid grid-cols-4 gap-2">
              {avatars.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`overflow-hidden rounded-lg border-2 transition-colors ${
                    selectedAvatar?.id === avatar.id
                      ? "border-accent"
                      : "border-transparent"
                  }`}
                  title={avatar.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatar.preview_image_url ?? ""}
                    alt={avatar.name}
                    className="aspect-square w-full object-cover"
                  />
                </button>
              ))}
            </div>
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
