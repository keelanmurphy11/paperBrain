import { createClient } from "@/lib/supabase/client";
import { compressNoteImage, isImageFile } from "@/lib/image-compress";

export const NOTE_IMAGES_BUCKET = "note-images";

function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export async function uploadNoteImage(
  noteId: string,
  file: File
): Promise<{ publicUrl: string; path: string }> {
  if (!isImageFile(file)) {
    throw new Error("That file isn’t a supported image");
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Not authenticated");

  const compressed = await compressNoteImage(file);
  const ext = extensionForMime(compressed.type);
  const objectPath = `${user.id}/${noteId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(NOTE_IMAGES_BUCKET)
    .upload(objectPath, compressed, {
      cacheControl: "31536000",
      contentType: compressed.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from(NOTE_IMAGES_BUCKET)
    .getPublicUrl(objectPath);

  return { publicUrl: data.publicUrl, path: objectPath };
}

/** Collect image File objects from a paste or drop DataTransfer. */
export function imageFilesFromDataTransfer(
  dataTransfer: DataTransfer | null
): File[] {
  if (!dataTransfer) return [];

  const files: File[] = [];

  if (dataTransfer.files?.length) {
    for (const file of Array.from(dataTransfer.files)) {
      if (isImageFile(file)) files.push(file);
    }
  }

  if (files.length > 0) return files;

  // Clipboard may expose images only via items
  if (dataTransfer.items?.length) {
    for (const item of Array.from(dataTransfer.items)) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file && isImageFile(file)) files.push(file);
      }
    }
  }

  return files;
}
