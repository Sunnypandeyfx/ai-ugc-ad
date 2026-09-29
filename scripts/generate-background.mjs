// One-off local tool: generates a static background image with Gemini
// ("nano banana") and saves it to public/backgrounds/. Not part of the
// deployed app — run manually with:
//   node --env-file=.env.local scripts/generate-background.mjs <name> "<prompt>"
import { writeFile, mkdir } from "node:fs/promises";

const [, , name, prompt] = process.argv;
if (!name || !prompt) {
  console.error('Usage: node --env-file=.env.local scripts/generate-background.mjs <name> "<prompt>"');
  process.exit(1);
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set.");
  process.exit(1);
}

const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
  method: "POST",
  headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "gemini-3.1-flash-image",
    input: [{ type: "text", text: prompt }],
    response_format: { type: "image", aspect_ratio: "16:9", image_size: "2K", mime_type: "image/jpeg" },
  }),
});

const text = await res.text();
if (!res.ok) {
  console.error(`Gemini request failed (${res.status}): ${text.slice(0, 1000)}`);
  process.exit(1);
}

const json = JSON.parse(text);
// Verified by inspecting a live response on 2026-09-29: the docs' quoted
// `output_image.data` field doesn't actually appear: the image comes back
// base64-encoded at steps[].content[].data (mime_type image/jpeg) instead.
const base64 = json.steps?.flatMap((s) => s.content ?? []).find((c) => c.data)?.data;
if (!base64) {
  await writeFile("scripts/last-response.json", text);
  console.error("No image returned. Full response saved to scripts/last-response.json");
  process.exit(1);
}

await mkdir("public/backgrounds", { recursive: true });
const outPath = `public/backgrounds/${name}.jpg`;
await writeFile(outPath, Buffer.from(base64, "base64"));
console.log(`Saved ${outPath}`);
