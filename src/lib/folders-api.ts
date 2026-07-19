import { createClient } from "@/lib/supabase/client";
import type { Folder, FolderId, Note } from "@/types";

export async function fetchFolders(): Promise<Folder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Folder[];
}

/** Ensure the current user has an Inbox folder (trigger + first-load fallback). */
export async function ensureInboxFolder(): Promise<Folder> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Not authenticated");

  const { data: existing, error: findError } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_inbox", true)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing as Folder;

  const { data, error } = await supabase
    .from("folders")
    .insert({
      name: "Inbox",
      user_id: user.id,
      position: 0,
      is_inbox: true,
      parent_id: null,
    })
    .select("*")
    .single();

  if (error) {
    // Race: another request created Inbox
    if (error.code === "23505") {
      const { data: raced, error: raceError } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_inbox", true)
        .maybeSingle();
      if (raceError) throw raceError;
      if (raced) return raced as Folder;
    }
    throw error;
  }

  return data as Folder;
}

export type CreateFolderOptions = {
  name: string;
  parentId?: FolderId | null;
  position?: number;
};

export async function createFolder(
  options: CreateFolderOptions
): Promise<Folder> {
  const name = options.name.trim();
  if (!name) throw new Error("Folder name required");

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Not authenticated");

  if (options.parentId) {
    const { data: parent, error: parentError } = await supabase
      .from("folders")
      .select("id, parent_id, user_id")
      .eq("id", options.parentId)
      .maybeSingle();

    if (parentError) throw parentError;
    if (!parent || parent.user_id !== user.id) {
      throw new Error("Parent folder not found");
    }
    if (parent.parent_id) {
      throw new Error("Folders can only nest one level deep");
    }
  }

  let position = options.position;
  if (position === undefined) {
    const query = supabase
      .from("folders")
      .select("position")
      .eq("user_id", user.id)
      .order("position", { ascending: false })
      .limit(1);

    const { data: siblings, error: sibError } = options.parentId
      ? await query.eq("parent_id", options.parentId)
      : await query.is("parent_id", null);

    if (sibError) throw sibError;
    position = (siblings?.[0]?.position ?? -1) + 1;
  }

  const { data, error } = await supabase
    .from("folders")
    .insert({
      name,
      user_id: user.id,
      parent_id: options.parentId ?? null,
      position,
      is_inbox: false,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Folder;
}

export async function renameFolder(
  id: FolderId,
  name: string
): Promise<Folder> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Folder name required");

  const supabase = createClient();
  const { data, error } = await supabase
    .from("folders")
    .update({ name: trimmed })
    .eq("id", id)
    .eq("is_inbox", false)
    .select("*")
    .single();

  if (error) throw error;
  return data as Folder;
}

export type DeleteFolderMode = "move_to_inbox" | "delete_notes";

export async function deleteFolder(
  id: FolderId,
  mode: DeleteFolderMode = "move_to_inbox"
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Not authenticated");

  const { data: folder, error: folderError } = await supabase
    .from("folders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (folderError) throw folderError;
  if (!folder) throw new Error("Folder not found");
  if (folder.is_inbox) throw new Error("Inbox folder cannot be deleted");

  const { data: children, error: childrenError } = await supabase
    .from("folders")
    .select("id")
    .eq("parent_id", id);

  if (childrenError) throw childrenError;

  const folderIds = [id, ...(children ?? []).map((c) => c.id as string)];

  if (mode === "move_to_inbox") {
    const inbox = await ensureInboxFolder();
    const { error: moveError } = await supabase
      .from("notes")
      .update({ folder_id: inbox.id })
      .in("folder_id", folderIds);

    if (moveError) throw moveError;
  } else {
    const { error: deleteNotesError } = await supabase
      .from("notes")
      .delete()
      .in("folder_id", folderIds);

    if (deleteNotesError) throw deleteNotesError;
  }

  // Children cascade via FK; delete parent (and any remaining children)
  const { error: deleteError } = await supabase
    .from("folders")
    .delete()
    .eq("id", id);

  if (deleteError) throw deleteError;
}

export async function moveNoteToFolder(
  noteId: string,
  folderId: FolderId
): Promise<Note> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notes")
    .update({ folder_id: folderId })
    .eq("id", noteId)
    .select("*")
    .single();

  if (error) throw error;
  return data as Note;
}
