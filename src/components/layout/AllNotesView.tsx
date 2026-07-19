"use client";

import { useMemo } from "react";
import { NotesCollectionView } from "@/components/layout/NotesCollectionView";
import { useAppNav } from "@/hooks/use-app-nav";
import { getFolderPath, useFolders } from "@/hooks/use-folders";
import { useCreateNote, useNotes } from "@/hooks/use-notes";
import { useNoteIdsForTag } from "@/hooks/use-tags";
import { toast } from "@/store/toast";
import { useUiStore } from "@/store/ui";

export function AllNotesView() {
  const { data: notes = [], isLoading, isError, error } = useNotes();
  const { data: folders = [] } = useFolders();
  const createNote = useCreateNote();
  const { openNote, openFolder } = useAppNav();
  const selectedTagId = useUiStore((s) => s.selectedTagId);
  const mobileHomePane = useUiStore((s) => s.mobileHomePane);
  const setMobileHomePane = useUiStore((s) => s.setMobileHomePane);
  const { data: taggedNoteIds, isLoading: tagFilterLoading } =
    useNoteIdsForTag(selectedTagId);

  const inboxId = useMemo(
    () => folders.find((f) => f.is_inbox)?.id ?? null,
    [folders]
  );

  const filteredNotes = useMemo(() => {
    if (!selectedTagId) return notes;
    if (!taggedNoteIds) return [];
    const allowed = new Set(taggedNoteIds);
    return notes.filter((note) => allowed.has(note.id));
  }, [notes, selectedTagId, taggedNoteIds]);

  async function handleCreate() {
    try {
      const note = await createNote.mutateAsync({
        folderId: inboxId ?? undefined,
      });
      openNote(note.id, { focusTitle: true });
    } catch (err) {
      console.error("Failed to create note", err);
      toast("Couldn’t create note. Try again.", "error");
    }
  }

  return (
    <NotesCollectionView
      title="All Notes"
      notes={filteredNotes}
      isLoading={isLoading || (Boolean(selectedTagId) && tagFilterLoading)}
      isError={isError}
      errorMessage={error instanceof Error ? error.message : undefined}
      emptyMessage={
        selectedTagId
          ? "No notes with this tag"
          : "No notes yet — create your first one"
      }
      onCreateNote={() => void handleCreate()}
      creating={createNote.isPending}
      onBack={
        mobileHomePane === "all-notes"
          ? () => setMobileHomePane("folders")
          : undefined
      }
      backLabel="Folders"
      getNoteMeta={(note) => getFolderPath(folders, note.folder_id)}
      onNoteMetaClick={(note) => {
        if (note.folder_id) openFolder(note.folder_id);
      }}
    />
  );
}
