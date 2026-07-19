import type { TipTapDoc } from "@/types";

export const EMPTY_DOC: TipTapDoc = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function getNotePreview(contentText: string, max = 120): string {
  const trimmed = contentText.replace(/\s+/g, " ").trim();
  if (!trimmed) return "Empty note";
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

export function isTipTapDoc(value: unknown): value is TipTapDoc {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as TipTapDoc).type === "doc"
  );
}
