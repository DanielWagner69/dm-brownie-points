/**
 * Compress a gallery/camera image so phone photos fit storage limits.
 * Returns a JPEG data URL under ~maxBytes payload.
 */
export async function compressImageFile(
  file: File,
  opts: { maxDim?: number; maxBytes?: number } = {},
): Promise<string> {
  const maxDim = opts.maxDim ?? 1280;
  const maxBytes = opts.maxBytes ?? 320_000;

  const bitmap = await createImageBitmap(file);
  let width = bitmap.width;
  let height = bitmap.height;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not process photo");
  }

  let quality = 0.82;
  let dataUrl = "";
  for (let attempt = 0; attempt < 6; attempt++) {
    const dimScale = attempt >= 3 ? 0.75 ** (attempt - 2) : 1;
    const w = Math.max(1, Math.round(width * dimScale));
    const h = Math.max(1, Math.round(height * dimScale));
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(bitmap, 0, 0, w, h);
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    // data URL is ~base64; approximate raw size
    const approxBytes = Math.floor((dataUrl.length - "data:image/jpeg;base64,".length) * 0.75);
    if (approxBytes <= maxBytes) break;
    quality = Math.max(0.4, quality - 0.12);
  }
  bitmap.close();
  return dataUrl;
}
