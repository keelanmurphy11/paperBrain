import type { Json, Note, TipTapDoc } from "@/types";

export const EMPTY_DOC: TipTapDoc = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export type NoteSortMode = "updated" | "created" | "title";

export const NOTE_SORT_LABELS: Record<NoteSortMode, string> = {
  updated: "Last edited",
  created: "Date created",
  title: "Title A–Z",
};

export function getNotePreview(contentText: string, max = 120): string {
  const trimmed = contentText.replace(/\s+/g, " ").trim();
  if (!trimmed) return "Empty note";
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

/** First durable image URL in TipTap JSON (skips transient blob: uploads). */
export function getFirstNoteImageSrc(
  content: TipTapDoc | Json | null | undefined
): string | null {
  if (!content || typeof content !== "object") return null;

  function walk(node: unknown): string | null {
    if (!node || typeof node !== "object") return null;
    const n = node as {
      type?: string;
      attrs?: { src?: unknown };
      content?: unknown[];
    };

    if (n.type === "image") {
      const src = n.attrs?.src;
      if (typeof src === "string" && src && !src.startsWith("blob:")) {
        return src;
      }
    }

    if (Array.isArray(n.content)) {
      for (const child of n.content) {
        const found = walk(child);
        if (found) return found;
      }
    }
    return null;
  }

  return walk(content);
}

export function sortNotes(notes: Note[], mode: NoteSortMode): Note[] {
  const next = [...notes];
  switch (mode) {
    case "created":
      return next.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    case "title":
      return next.sort((a, b) => {
        const ta = (a.title.trim() || "Untitled").toLocaleLowerCase();
        const tb = (b.title.trim() || "Untitled").toLocaleLowerCase();
        return ta.localeCompare(tb);
      });
    case "updated":
    default:
      return next.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
  }
}

export function isTipTapDoc(value: unknown): value is TipTapDoc {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as TipTapDoc).type === "doc"
  );
}
