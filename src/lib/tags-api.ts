import { createClient } from "@/lib/supabase/client";
import type { Tag } from "@/types";

function escapeIlike(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export async function fetchTags(): Promise<Tag[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Tag[];
}

export async function fetchTagsForNote(noteId: string): Promise<Tag[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("note_tags")
    .select("tags(*)")
    .eq("note_id", noteId);

  if (error) throw error;

  const tags: Tag[] = [];
  for (const row of data ?? []) {
    const tag = (row as { tags: Tag | Tag[] | null }).tags;
    if (!tag) continue;
    tags.push(Array.isArray(tag) ? tag[0] : tag);
  }

  return tags.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}

export async function fetchNoteIdsForTag(tagId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("note_tags")
    .select("note_id")
    .eq("tag_id", tagId);

  if (error) throw error;
  return (data ?? []).map((row) => row.note_id as string);
}

export async function findOrCreateTag(name: string): Promise<Tag> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tag name required");

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Not authenticated");

  const { data: existing, error: findError } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", user.id)
    .ilike("name", escapeIlike(trimmed))
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing as Tag;

  const { data, error } = await supabase
    .from("tags")
    .insert({ name: trimmed, user_id: user.id })
    .select("*")
    .single();

  if (error) {
    // Race on unique (user_id, name) — re-fetch
    if (error.code === "23505") {
      const { data: raced, error: raceError } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", user.id)
        .ilike("name", escapeIlike(trimmed))
        .maybeSingle();
      if (raceError) throw raceError;
      if (raced) return raced as Tag;
    }
    throw error;
  }

  return data as Tag;
}

export async function attachTagToNote(
  noteId: string,
  tagId: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("note_tags").insert({
    note_id: noteId,
    tag_id: tagId,
  });

  // Ignore duplicate attach
  if (error && error.code !== "23505") throw error;
}

export async function detachTagFromNote(
  noteId: string,
  tagId: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("note_tags")
    .delete()
    .eq("note_id", noteId)
    .eq("tag_id", tagId);

  if (error) throw error;
}

export async function addTagToNote(
  noteId: string,
  name: string
): Promise<Tag> {
  const tag = await findOrCreateTag(name);
  await attachTagToNote(noteId, tag.id);
  return tag;
}
