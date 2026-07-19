import { createClient } from "@/lib/supabase/client";
import type { Note, NoteLink } from "@/types";

export type Backlink = {
  link: NoteLink;
  note: Pick<Note, "id" | "title" | "content_text" | "updated_at">;
};

export async function fetchOutgoingLinks(
  sourceNoteId: string
): Promise<NoteLink[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("note_links")
    .select("*")
    .eq("source_note_id", sourceNoteId);

  if (error) throw error;
  return (data ?? []) as NoteLink[];
}

export async function fetchBacklinks(noteId: string): Promise<Backlink[]> {
  const supabase = createClient();
  const { data: links, error } = await supabase
    .from("note_links")
    .select("*")
    .eq("target_note_id", noteId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!links?.length) return [];

  const sourceIds = links.map((l) => l.source_note_id as string);
  const { data: notes, error: notesError } = await supabase
    .from("notes")
    .select("id, title, content_text, updated_at")
    .in("id", sourceIds);

  if (notesError) throw notesError;

  const byId = new Map(
    (notes ?? []).map((n) => [
      n.id as string,
      n as Pick<Note, "id" | "title" | "content_text" | "updated_at">,
    ])
  );

  const result: Backlink[] = [];
  for (const link of links as NoteLink[]) {
    const note = byId.get(link.source_note_id);
    if (!note) continue;
    result.push({ link, note });
  }
  return result;
}

export async function syncOutgoingLinks(
  sourceNoteId: string,
  targetIds: Iterable<string>
): Promise<{ added: string[]; removed: string[] }> {
  const desired = new Set(
    Array.from(targetIds).filter((id) => Boolean(id) && id !== sourceNoteId)
  );

  const existing = await fetchOutgoingLinks(sourceNoteId);
  const existingIds = new Set(existing.map((l) => l.target_note_id));

  const toAdd = Array.from(desired).filter((id) => !existingIds.has(id));
  const toRemove = existing.filter((l) => !desired.has(l.target_note_id));

  const supabase = createClient();

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("note_links")
      .delete()
      .eq("source_note_id", sourceNoteId)
      .in(
        "target_note_id",
        toRemove.map((l) => l.target_note_id)
      );
    if (error) throw error;
  }

  if (toAdd.length > 0) {
    const { error } = await supabase.from("note_links").insert(
      toAdd.map((target_note_id) => ({
        source_note_id: sourceNoteId,
        target_note_id,
      }))
    );
    // Ignore unique conflicts from races
    if (error && error.code !== "23505") throw error;
  }

  return {
    added: toAdd,
    removed: toRemove.map((l) => l.target_note_id),
  };
}
