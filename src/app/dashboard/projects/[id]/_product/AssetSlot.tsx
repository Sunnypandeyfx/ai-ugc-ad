"use client";

import { useId, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { prepareImage } from "@/lib/prepareImage";
import { ASSET_BUCKET, type AssetKind, type ProductAsset } from "@/lib/product";
import { deleteAsset, ensureProduct, registerAsset } from "./actions";

type Props = {
  projectId: string;
  userId: string;
  kind: AssetKind;
  label: string;
  assets: ProductAsset[];
  single: boolean;
  max: number;
  required?: boolean;
  fit?: "cover" | "contain";
};

export default function AssetSlot({
  projectId,
  userId,
  kind,
  label,
  assets,
  single,
  max,
  required,
  fit = "cover",
}: Props) {
  const inputId = useId();
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [removing, startRemove] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function upload(files: File[]) {
    setError(null);
    const room = single ? 1 : max - assets.length;
    if (room <= 0) return setError(`You can add up to ${max}.`);
    const batch = files.slice(0, room);
    if (files.length > room) setError(`Only ${room} more can be added here.`);

    setUploading((n) => n + batch.length);
    const product = await ensureProduct(projectId);
    if (product.error !== null) {
      setUploading((n) => n - batch.length);
      return setError(product.error);
    }

    const supabase = createClient();
    await Promise.all(
      batch.map(async (file) => {
        try {
          const prepared = await prepareImage(file);
          const path = `${userId}/${product.productId}/${crypto.randomUUID()}.${prepared.ext}`;
          const { error: uploadError } = await supabase.storage
            .from(ASSET_BUCKET)
            .upload(path, prepared.blob, { contentType: prepared.type });
          if (uploadError) throw new Error(uploadError.message);
          const result = await registerAsset(projectId, kind, path);
          if (result.error) throw new Error(result.error);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Upload failed.");
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
  }

  function remove(assetId: string) {
    setError(null);
    setRemovingId(assetId);
    startRemove(async () => {
      const result = await deleteAsset(projectId, assetId);
      if (result.error) setError(result.error);
      setRemovingId(null);
    });
  }

  const canAdd = single ? true : assets.length < max;
  const picker = (
    <input
      id={inputId}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      multiple={!single}
      className="sr-only"
      disabled={uploading > 0}
      onChange={(e) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = "";
        if (files.length) upload(files);
      }}
    />
  );

  const tile = "relative aspect-square overflow-hidden rounded-xl";
  const imgFit = fit === "contain" ? "object-contain p-2" : "object-cover";

  if (single) {
    const asset = assets[0];
    return (
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <p className="text-xs text-fg-muted">{label}</p>
          {required && <span className="text-[10px] uppercase tracking-wide text-accent">Required</span>}
        </div>
        {asset ? (
          <div className={`group ${tile} border border-border bg-surface-2`}>
            {asset.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset.url} alt={label} className={`h-full w-full ${imgFit}`} />
            )}
            <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <label
                htmlFor={inputId}
                className="flex-1 cursor-pointer rounded-full bg-white/10 px-2 py-1 text-center text-[11px] text-white backdrop-blur hover:bg-white/20"
              >
                Replace
              </label>
              <button
                type="button"
                onClick={() => remove(asset.id)}
                disabled={removing}
                className="flex-1 rounded-full bg-white/10 px-2 py-1 text-[11px] text-white backdrop-blur hover:bg-white/20"
              >
                {removingId === asset.id ? "…" : "Remove"}
              </button>
            </div>
            {uploading > 0 && <UploadingOverlay />}
          </div>
        ) : (
          <label
            htmlFor={inputId}
            className={`${tile} flex cursor-pointer flex-col items-center justify-center gap-1 border border-dashed text-fg-subtle transition-colors hover:border-accent hover:text-fg ${
              required ? "border-accent/50" : "border-border-strong"
            }`}
          >
            {uploading > 0 ? <UploadingOverlay /> : <PlusIcon />}
            <span className="text-[11px]">{uploading > 0 ? "Uploading…" : "Add photo"}</span>
          </label>
        )}
        {picker}
        {error && <p className="mt-1.5 text-[11px] text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <p className="mb-1.5 text-xs text-fg-muted">
        {label}{" "}
        <span className="text-fg-subtle">
          ({assets.length}/{max})
        </span>
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {assets.map((asset) => (
          <div key={asset.id} className={`group ${tile} border border-border bg-surface-2`}>
            {asset.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset.url} alt={label} className={`h-full w-full ${imgFit}`} />
            )}
            <button
              type="button"
              onClick={() => remove(asset.id)}
              disabled={removing}
              aria-label={`Remove ${label.toLowerCase()} image`}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
            >
              {removingId === asset.id ? "…" : "✕"}
            </button>
          </div>
        ))}
        {Array.from({ length: uploading }).map((_, i) => (
          <div key={`up-${i}`} className={`${tile} border border-border bg-surface-2`}>
            <UploadingOverlay />
          </div>
        ))}
        {canAdd && uploading === 0 && (
          <label
            htmlFor={inputId}
            className={`${tile} flex cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-border-strong text-fg-subtle transition-colors hover:border-accent hover:text-fg`}
          >
            <PlusIcon />
            <span className="text-[11px]">Add</span>
          </label>
        )}
      </div>
      {picker}
      {error && <p className="mt-1.5 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function UploadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
    </div>
  );
}
