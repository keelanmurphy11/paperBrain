import { createClient } from "@/lib/supabase/client";
import type { Source } from "@/types";

export async function fetchSourcesForNote(noteId: string): Promise<Source[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("note_id", noteId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Source[];
}

export type CreateSourcePayload = {
  noteId: string;
  url: string;
  title?: string | null;
};

export async function createSource(
  payload: CreateSourcePayload
): Promise<Source> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sources")
    .insert({
      note_id: payload.noteId,
      url: payload.url,
      title: payload.title?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Source;
}

export async function deleteSource(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("sources").delete().eq("id", id);
  if (error) throw error;
}
