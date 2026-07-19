import imageCompression from "browser-image-compression";

const MAX_WIDTH_OR_HEIGHT = 1600;
const MAX_SIZE_MB = 1.2;
const INITIAL_QUALITY = 0.82;

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export function isImageFile(file: File): boolean {
  if (ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return true;
  }
  // Some OS clipboards omit type — fall back to filename
  return /\.(jpe?g|png|webp|gif)$/i.test(file.name);
}

export async function compressNoteImage(file: File): Promise<File> {
  // Keep animated GIFs as-is (compression would flatten frames)
  if (file.type === "image/gif") {
    return file;
  }

  try {
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT,
      maxSizeMB: MAX_SIZE_MB,
      initialQuality: INITIAL_QUALITY,
      useWebWorker: true,
      fileType: file.type === "image/png" ? "image/webp" : undefined,
    });

    const ext =
      compressed.type === "image/webp"
        ? "webp"
        : compressed.type === "image/png"
          ? "png"
          : "jpg";

    const base =
      file.name.replace(/\.[^.]+$/, "").trim() || "image";

    return new File([compressed], `${base}.${ext}`, {
      type: compressed.type || "image/jpeg",
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn("Image compression failed; uploading original", err);
    return file;
  }
}
