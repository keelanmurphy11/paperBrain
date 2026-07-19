import { createSource } from "@/lib/sources-api";
import { createNote, updateNote } from "@/lib/notes-api";
import { ensureInboxFolder } from "@/lib/folders-api";
import { normalizeUrl } from "@/lib/url";
import type { Note, Source, TipTapDoc } from "@/types";

export type QuickCaptureInput = {
  content: TipTapDoc;
  contentText: string;
  sourceUrl?: string;
};

export type QuickCaptureResult = {
  note: Note;
  source: Source | null;
};

/** First meaningful line → note title (no title field required). */
export function titleFromCaptureText(text: string, max = 60): string {
  const first =
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? "";

  const cleaned = first
    .replace(/^#{1,6}\s+/, "")
    .replace(/^[-*+]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .replace(/^>\s+/, "")
    .replace(/\*\*|__/g, "")
    .replace(/\*|_/g, "")
    .trim();

  if (!cleaned) return "Quick note";
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, Math.max(1, max - 1))}…`;
}

async function fetchPageTitle(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch("/api/fetch-title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: pageUrl }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string | null };
    return data.title?.trim() || null;
  } catch {
    return null;
  }
}

function appendSourceBlock(
  doc: TipTapDoc,
  source: Source
): TipTapDoc {
  const content = Array.isArray(doc.content) ? [...doc.content] : [];
  content.push({
    type: "sourceBlock",
    attrs: {
      sourceId: source.id,
      url: source.url,
      title: source.title,
    },
  });
  return { ...doc, type: "doc", content };
}

/**
 * Creates an Inbox note from quick-capture content.
 * Optionally attaches a source (same title-fetch path as the full editor).
 */
export async function submitQuickCapture(
  input: QuickCaptureInput
): Promise<QuickCaptureResult> {
  const contentText = input.contentText.trim();
  if (!contentText && !input.sourceUrl?.trim()) {
    throw new Error("Write something first");
  }

  const inbox = await ensureInboxFolder();
  const title = titleFromCaptureText(contentText || "Quick note");

  let note = await createNote({
    title,
    folderId: inbox.id,
    content: input.content,
    content_text: contentText,
  });

  let source: Source | null = null;
  const rawUrl = input.sourceUrl?.trim();
  if (rawUrl) {
    const url = normalizeUrl(rawUrl);
    try {
      new URL(url);
    } catch {
      throw new Error("That doesn’t look like a valid URL");
    }

    const pageTitle = await fetchPageTitle(url);
    source = await createSource({
      noteId: note.id,
      url,
      title: pageTitle,
    });

    const nextContent = appendSourceBlock(input.content, source);
    note = await updateNote(note.id, {
      title: note.title,
      content: nextContent,
      content_text: contentText,
    });
  }

  return { note, source };
}
