"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomAvatarRecord } from "./actions";

type Stage = "idle" | "uploading" | "training-start" | "error";

export default function NewCreatorForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const fileInput = document.getElementById("video") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      setError("Choose a video first.");
      return;
    }
    if (!name.trim()) {
      setError("Give this creator a name.");
      return;
    }

    setStage("uploading");
    try {
      setProgress("Preparing upload…");
      const initRes = await fetch("/api/creators/init-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          sizeBytes: file.size,
        }),
      });
      const init = await initRes.json();
      if (!initRes.ok) throw new Error(init.error || "Could not start upload.");

      setProgress("Uploading footage…");
      const putRes = await fetch(init.uploadUrl, {
        method: "PUT",
        headers: init.uploadHeaders,
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload to HeyGen failed.");

      setProgress("Finishing upload…");
      const completeRes = await fetch("/api/creators/complete-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: init.assetId }),
      });
      const complete = await completeRes.json();
      if (!completeRes.ok) throw new Error(complete.error || "Upload did not finish.");

      setStage("training-start");
      setProgress("Starting training…");
      const result = await createCustomAvatarRecord(name, init.assetId);
      if (result.error || !result.id) {
        throw new Error(result.error || "Could not create creator.");
      }

      router.push(`/dashboard/creators/${result.id}`);
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const busy = stage === "uploading" || stage === "training-start";

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-5">
      <div>
        <label htmlFor="name" className="text-xs text-fg-muted">
          Creator name
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={busy}
          className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent disabled:opacity-60"
          placeholder="e.g. Jamie"
        />
      </div>

      <div>
        <label htmlFor="video" className="text-xs text-fg-muted">
          Video of the person
        </label>
        <input
          id="video"
          type="file"
          accept="video/mp4,video/webm"
          required
          disabled={busy}
          className="mt-1.5 w-full rounded-lg border border-dashed border-border-strong bg-surface px-3 py-2.5 text-sm text-fg-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-xs file:text-fg disabled:opacity-60"
        />
        <p className="mt-2 text-xs text-fg-subtle">
          15 seconds to 10 minutes. One person, facing the camera, speaking
          clearly, for the whole clip. mp4 or webm.
        </p>
      </div>

      <div className="rounded-lg border border-border-strong bg-surface-2 p-4 text-xs text-fg-muted">
        The person in this video must personally confirm consent afterward by
        recording a short statement on camera through a link HeyGen sends —
        this creator can&rsquo;t be used until they do. Only upload footage of
        someone who has agreed to this.
      </div>

      {busy && <p className="text-sm text-fg-muted">{progress}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="mt-2 w-full rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-fg transition-transform hover:scale-[1.02] disabled:opacity-60"
      >
        {busy ? "Working…" : "Create creator"}
      </button>
    </form>
  );
}
