"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomAvatarRecord, createGeneratedAvatarRecord } from "./actions";

type Mode = "upload" | "generate";
type Stage = "idle" | "working" | "error";

export default function NewCreatorForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("generate");
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [gender, setGender] = useState<"female" | "male">("female");

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const fileInput = document.getElementById("video") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return setError("Choose a video first.");
    if (!name.trim()) return setError("Give this creator a name.");

    setStage("working");
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

      setProgress("Starting training…");
      const result = await createCustomAvatarRecord(name, init.assetId);
      if (result.error || !result.id) throw new Error(result.error || "Could not create creator.");

      router.push(`/dashboard/creators/${result.id}`);
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleGenerateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Give this creator a name.");
    if (!prompt.trim()) return setError("Describe the character you want.");

    setStage("working");
    setProgress("Generating character…");
    try {
      const result = await createGeneratedAvatarRecord(name, prompt, gender);
      if (result.error || !result.id) throw new Error(result.error || "Could not create creator.");
      router.push(`/dashboard/creators/${result.id}`);
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const busy = stage === "working";

  return (
    <div className="mt-10">
      <div className="inline-flex rounded-full border border-border-strong bg-surface p-1">
        <button
          type="button"
          onClick={() => setMode("generate")}
          className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
            mode === "generate" ? "bg-accent text-accent-fg" : "text-fg-muted"
          }`}
        >
          Generate a character
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
            mode === "upload" ? "bg-accent text-accent-fg" : "text-fg-muted"
          }`}
        >
          Upload real footage
        </button>
      </div>

      {mode === "generate" ? (
        <form onSubmit={handleGenerateSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="genName" className="text-xs text-fg-muted">
              Creator name
            </label>
            <input
              id="genName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
              className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent disabled:opacity-60"
              placeholder="e.g. Maya"
            />
          </div>

          <div>
            <label htmlFor="gender" className="text-xs text-fg-muted">
              Gender
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as "female" | "male")}
              disabled={busy}
              className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent disabled:opacity-60"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>

          <div>
            <label htmlFor="prompt" className="text-xs text-fg-muted">
              Describe the character
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={busy}
              rows={4}
              maxLength={1000}
              className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent disabled:opacity-60"
              placeholder="Woman in her late 20s, warm smile, curly brown hair, casual sweater, sitting in a bright modern living room, natural light"
            />
            <p className="mt-1 text-xs text-fg-subtle">
              Name the age, expression, wardrobe, and setting for best results.
            </p>
          </div>

          <div className="rounded-lg border border-border-strong bg-surface-2 p-4 text-xs text-fg-muted">
            This character is fully AI-generated — no real person is involved,
            so there&rsquo;s no consent step. It&rsquo;s ready to use as soon
            as generation finishes.
          </div>

          {busy && <p className="text-sm text-fg-muted">{progress}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 w-full rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-fg transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {busy ? "Working…" : "Generate character"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleUploadSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="name" className="text-xs text-fg-muted">
              Creator name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              disabled={busy}
              className="mt-1.5 w-full rounded-lg border border-dashed border-border-strong bg-surface px-3 py-2.5 text-sm text-fg-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-xs file:text-fg disabled:opacity-60"
            />
            <p className="mt-2 text-xs text-fg-subtle">
              15 seconds to 10 minutes. One person, facing the camera, speaking
              clearly, for the whole clip. mp4 or webm.
            </p>
          </div>

          <div className="rounded-lg border border-border-strong bg-surface-2 p-4 text-xs text-fg-muted">
            The person in this video must personally confirm consent afterward
            by recording a short statement on camera through a link HeyGen
            sends — this creator can&rsquo;t be used until they do. Only
            upload footage of someone who has agreed to this.
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
      )}
    </div>
  );
}
