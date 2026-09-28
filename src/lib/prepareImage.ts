import { ALLOWED_IMAGE_TYPES, MAX_ASSET_BYTES } from "@/lib/product";

const MAX_EDGE = 2048;
// Re-encode above this size to leave headroom under the 5 MB bucket limit.
const REENCODE_ABOVE_BYTES = 4 * 1024 * 1024;

export type PreparedImage = { blob: Blob; type: string; ext: "jpg" | "png" | "webp" };

const EXT: Record<string, PreparedImage["ext"]> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, 0.9));
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    throw new Error(
      `${file.name}: use a JPG, PNG or WebP image. iPhone HEIC photos can be exported as JPG.`,
    );
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error(`${file.name}: this image could not be read.`);

  const longest = Math.max(bitmap.width, bitmap.height);
  if (longest <= MAX_EDGE && file.size <= REENCODE_ABOVE_BYTES) {
    bitmap.close();
    return { blob: file, type: file.type, ext: EXT[file.type] };
  }

  const scale = Math.min(1, MAX_EDGE / longest);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // PNG keeps transparency (logos); fall back to JPEG if it's still too big.
  let type = file.type === "image/png" ? "image/png" : "image/jpeg";
  let blob = await toBlob(canvas, type);
  if (blob && blob.size > MAX_ASSET_BYTES && type === "image/png") {
    type = "image/jpeg";
    blob = await toBlob(canvas, type);
  }
  if (!blob || blob.size > MAX_ASSET_BYTES) {
    throw new Error(`${file.name}: the image is too large even after resizing.`);
  }
  return { blob, type, ext: EXT[type] };
}
