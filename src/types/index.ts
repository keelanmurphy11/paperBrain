export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type NoteId = string;
export type TagId = string;
export type SourceId = string;
export type NoteLinkId = string;
export type FolderId = string;

/** Tiptap document JSON (ProseMirror schema). */
export type TipTapDoc = {
  type: "doc";
  content?: Json[];
  [key: string]: Json | undefined;
};

export type Note = {
  id: NoteId;
  title: string;
  content: TipTapDoc | Json;
  content_text: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  folder_id: FolderId | null;
};

export type Folder = {
  id: FolderId;
  name: string;
  parent_id: FolderId | null;
  user_id: string;
  position: number;
  is_inbox: boolean;
  created_at: string;
};

export type Source = {
  id: SourceId;
  note_id: NoteId;
  url: string;
  title: string | null;
  created_at: string;
};

export type Tag = {
  id: TagId;
  name: string;
  user_id: string;
};

export type NoteTag = {
  note_id: NoteId;
  tag_id: TagId;
};

export type NoteLink = {
  id: NoteLinkId;
  source_note_id: NoteId;
  target_note_id: NoteId;
  created_at: string;
};
