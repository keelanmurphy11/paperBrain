"use client";

import { useEffect, useMemo, useState } from "react";
import { DeleteFolderDialog } from "@/components/layout/DeleteFolderDialog";
import { NotesCollectionView } from "@/components/layout/NotesCollectionView";
import { useAppNav } from "@/hooks/use-app-nav";
import {
  folderNoteCount,
  getChildFolders,
  notesInFolder,
  useDeleteFolder,
  useFolders,
  useRenameFolder,
} from "@/hooks/use-folders";
import { useCreateNote, useNotes } from "@/hooks/use-notes";
import { useNoteIdsForTag } from "@/hooks/use-tags";
import type { DeleteFolderMode } from "@/lib/folders-api";
import { folderPath, HOME_PATH } from "@/lib/navigation";
import { toast } from "@/store/toast";
import { useUiStore } from "@/store/ui";
import type { FolderId } from "@/types";

type FolderViewProps = {
  folderId: FolderId;
};

export function FolderView({ folderId }: FolderViewProps) {
  const { data: notes = [], isLoading, isError, error } = useNotes();
  const { data: folders = [], isLoading: foldersLoading } = useFolders();
  const createNote = useCreateNote();
  const renameFolder = useRenameFolder();
  const deleteFolder = useDeleteFolder();
  const { openHome, openNote, openFolder, goBack } = useAppNav();
  const setLastFolderId = useUiStore((s) => s.setLastFolderId);
  const setMobileHomePane = useUiStore((s) => s.setMobileHomePane);
  const selectedTagId = useUiStore((s) => s.selectedTagId);
  const { data: taggedNoteIds, isLoading: tagFilterLoading } =
    useNoteIdsForTag(selectedTagId);

  const [pendingDelete, setPendingDelete] = useState(false);

  const folder = folders.find((f) => f.id === folderId) ?? null;
  const parent = folder?.parent_id
    ? folders.find((f) => f.id === folder.parent_id) ?? null
    : null;

  function handleBack() {
    if (parent) {
      goBack(folderPath(parent.id));
      return;
    }
    setMobileHomePane("folders");
    goBack(HOME_PATH);
  }

  useEffect(() => {
    if (folder) setLastFolderId(folder.id);
  }, [folder, setLastFolderId]);

  useEffect(() => {
    if (foldersLoading || folders.length === 0) return;
    if (!folders.some((f) => f.id === folderId)) {
      openHome();
    }
  }, [folders, foldersLoading, folderId, openHome]);

  const subfolders = useMemo(
    () => getChildFolders(folders, folderId),
    [folders, folderId]
  );

  const folderNotes = useMemo(() => {
    const inFolder = notesInFolder(notes, folderId);
    if (!selectedTagId) return inFolder;
    if (!taggedNoteIds) return [];
    const allowed = new Set(taggedNoteIds);
    return inFolder.filter((note) => allowed.has(note.id));
  }, [notes, folderId, selectedTagId, taggedNoteIds]);

  async function handleCreate() {
    try {
      const note = await createNote.mutateAsync({ folderId });
      openNote(note.id, { focusTitle: true });
    } catch (err) {
      console.error("Failed to create note", err);
      toast("Couldn’t create note. Try again.", "error");
    }
  }

  async function handleRename(name: string) {
    try {
      await renameFolder.mutateAsync({ id: folderId, name });
    } catch (err) {
      console.error("Failed to rename folder", err);
      toast(
        err instanceof Error ? err.message : "Couldn’t rename folder",
        "error"
      );
      throw err;
    }
  }

  async function handleDeleteConfirm(mode: DeleteFolderMode) {
    try {
      await deleteFolder.mutateAsync({ id: folderId, mode });
      setPendingDelete(false);
      toast("Folder deleted", "success");
      if (parent) openFolder(parent.id);
      else openHome();
    } catch (err) {
      console.error("Failed to delete folder", err);
      toast(
        err instanceof Error ? err.message : "Couldn’t delete folder",
        "error"
      );
    }
  }

  const title = folder?.name ?? "Folder";
  const emptyMessage = selectedTagId
    ? "No notes with this tag in this folder"
    : `No notes in ${title} yet`;

  return (
    <>
      <NotesCollectionView
        title={title}
        notes={folderNotes}
        allNotesForCounts={notes}
        isLoading={
          isLoading ||
          foldersLoading ||
          (Boolean(selectedTagId) && tagFilterLoading)
        }
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
        emptyMessage={emptyMessage}
        onCreateNote={() => void handleCreate()}
        creating={createNote.isPending}
        onBack={handleBack}
        backLabel={parent?.name ?? "Folders"}
        breadcrumb={
          parent ? { id: parent.id, name: parent.name } : null
        }
        subfolders={subfolders}
        folderActions={
          folder && !folder.is_inbox
            ? {
                canMutate: true,
                onRename: handleRename,
                onDelete: () => setPendingDelete(true),
              }
            : null
        }
      />

      <DeleteFolderDialog
        open={pendingDelete}
        folderName={title}
        noteCount={folderNoteCount(notes, folderId)}
        busy={deleteFolder.isPending}
        onCancel={() => setPendingDelete(false)}
        onConfirm={(mode) => void handleDeleteConfirm(mode)}
      />
    </>
  );
}
