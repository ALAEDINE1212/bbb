/** legacy toDisplayableImage(): iPhone HEIC/HEIF -> JPEG so every browser can show it.
    heic2any is large, so it is only loaded when a HEIC file actually turns up. */
export async function toDisplayableImage(file: File): Promise<File> {
  const isHeic = /\.hei[cf]$/i.test(file.name) || /heic|heif/i.test(file.type);
  if (!isHeic) return file;
  try {
    const heic2any = (await import("heic2any")).default;
    const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    const jpg = Array.isArray(blob) ? blob[0] : blob;
    return new File([jpg], file.name.replace(/\.hei[cf]$/i, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** What every upload goes through, in the legacy order: make displayable, then compress. */
export async function prepareImage(file: File): Promise<File> {
  return compressImage(await toDisplayableImage(file));
}

/** Port of the legacy compressImage(): longest side ≤ 1600px, JPEG q0.8, never blocks an upload. */
export async function compressImage(file: File, maxDimension = 1600, quality = 0.8): Promise<File> {
  if (!file || !/^image\//.test(file.type)) return file;
  if (file.type === "image/gif") return file;
  try {
    const src = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(src.width, src.height));
    const w = Math.max(1, Math.round(src.width * scale));
    const h = Math.max(1, Math.round(src.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(src, 0, 0, w, h);
    src.close();
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob) return file;
    if (blob.size >= file.size && scale === 1) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
