import { createClient } from "@/lib/supabase/client";
import { ensureInboxFolder } from "@/lib/folders-api";
import { EMPTY_DOC } from "@/lib/notes";
import type { FolderId, Note, TipTapDoc } from "@/types";

export async function fetchNotes(): Promise<Note[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Note[];
}

export async function fetchNote(id: string): Promise<Note | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as Note | null;
}

export type CreateNoteOptions = {
  title?: string;
  /** Defaults to the user's Inbox when omitted. */
  folderId?: FolderId | null;
  content?: TipTapDoc;
  content_text?: string;
  /** Optional template id persisted for future filtering (e.g. "fact"). */
  templateType?: string | null;
};

export async function createNote(
  options: CreateNoteOptions = {}
): Promise<Note> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Not authenticated");

  let folderId = options.folderId ?? null;
  if (!folderId) {
    const inbox = await ensureInboxFolder();
    folderId = inbox.id;
  }

  const { data, error } = await supabase
    .from("notes")
    .insert({
      title: options.title?.trim() ?? "",
      content: options.content ?? EMPTY_DOC,
      content_text: options.content_text ?? "",
      user_id: user.id,
      folder_id: folderId,
      template_type: options.templateType ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Note;
}

export type UpdateNotePayload = {
  title: string;
  content: TipTapDoc;
  content_text: string;
};

export async function updateNote(
  id: string,
  payload: UpdateNotePayload
): Promise<Note> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notes")
    .update({
      title: payload.title,
      content: payload.content,
      content_text: payload.content_text,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as Note;
}

export async function deleteNote(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}
