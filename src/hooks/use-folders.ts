"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createFolder,
  deleteFolder,
  ensureInboxFolder,
  fetchFolders,
  moveNoteToFolder,
  renameFolder,
  type CreateFolderOptions,
  type DeleteFolderMode,
} from "@/lib/folders-api";
import { notesQueryKey } from "@/hooks/use-notes";
import type { Folder, FolderId, Note } from "@/types";

export const foldersQueryKey = ["folders"] as const;

export const NOTE_DRAG_MIME = "application/x-paperbrain-note-id";

export function useFolders() {
  return useQuery({
    queryKey: foldersQueryKey,
    queryFn: async () => {
      await ensureInboxFolder();
      return fetchFolders();
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: CreateFolderOptions) => createFolder(options),
    onSuccess: (folder) => {
      queryClient.setQueryData<Folder[]>(foldersQueryKey, (prev) => {
        if (!prev) return [folder];
        if (prev.some((f) => f.id === folder.id)) return prev;
        return sortFolders([...prev, folder]);
      });
    },
  });
}

export function useRenameFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: FolderId; name: string }) =>
      renameFolder(id, name),
    onSuccess: (folder) => {
      queryClient.setQueryData<Folder[]>(foldersQueryKey, (prev) => {
        if (!prev) return [folder];
        return sortFolders(prev.map((f) => (f.id === folder.id ? folder : f)));
      });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      mode,
    }: {
      id: FolderId;
      mode: DeleteFolderMode;
    }) => deleteFolder(id, mode),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: foldersQueryKey }),
        queryClient.invalidateQueries({ queryKey: notesQueryKey }),
      ]);
    },
  });
}

export function useMoveNoteToFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      noteId,
      folderId,
    }: {
      noteId: string;
      folderId: FolderId;
    }) => moveNoteToFolder(noteId, folderId),
    onMutate: async ({ noteId, folderId }) => {
      await queryClient.cancelQueries({ queryKey: notesQueryKey });
      const previous = queryClient.getQueryData<Note[]>(notesQueryKey);

      queryClient.setQueryData<Note[]>(notesQueryKey, (prev) =>
        (prev ?? []).map((n) =>
          n.id === noteId ? { ...n, folder_id: folderId } : n
        )
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notesQueryKey, context.previous);
      }
    },
    onSuccess: (note) => {
      queryClient.setQueryData<Note[]>(notesQueryKey, (prev) => {
        if (!prev) return [note];
        return prev.map((n) => (n.id === note.id ? note : n));
      });
    },
  });
}

export function sortFolders(folders: Folder[]): Folder[] {
  return [...folders].sort((a, b) => {
    if (a.is_inbox !== b.is_inbox) return a.is_inbox ? -1 : 1;
    if (a.position !== b.position) return a.position - b.position;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

export function getRootFolders(folders: Folder[]): Folder[] {
  return sortFolders(folders.filter((f) => f.parent_id === null));
}

export function getChildFolders(
  folders: Folder[],
  parentId: FolderId
): Folder[] {
  return sortFolders(folders.filter((f) => f.parent_id === parentId));
}

/** Direct notes in a folder (does not include subfolder notes). */
export function notesInFolder(notes: Note[], folderId: FolderId): Note[] {
  return notes.filter((n) => n.folder_id === folderId);
}

/** Direct note count only — keeps parent vs subfolder counts predictable. */
export function folderNoteCount(notes: Note[], folderId: FolderId): number {
  return notes.filter((n) => n.folder_id === folderId).length;
}

/** Notes sitting in Inbox (the default landing place for unsorted work). */
export function inboxUnfiledCount(notes: Note[], folders: Folder[]): number {
  const inbox = folders.find((f) => f.is_inbox);
  if (!inbox) return 0;
  return folderNoteCount(notes, inbox.id);
}

export function getFolderPath(
  folders: Folder[],
  folderId: FolderId | null | undefined
): string {
  if (!folderId) return "Unfiled";
  const folder = folders.find((f) => f.id === folderId);
  if (!folder) return "Unfiled";
  if (!folder.parent_id) return folder.name;
  const parent = folders.find((f) => f.id === folder.parent_id);
  return parent ? `${parent.name} / ${folder.name}` : folder.name;
}

export type FolderPickerOption = {
  id: FolderId;
  name: string;
  path: string;
  isInbox: boolean;
  depth: 0 | 1;
};

/** Flat list of folders for pickers/search filters (Inbox first, then roots + children). */
export function buildFolderPickerOptions(
  folders: Folder[]
): FolderPickerOption[] {
  const options: FolderPickerOption[] = [];
  for (const root of getRootFolders(folders)) {
    options.push({
      id: root.id,
      name: root.name,
      path: root.name,
      isInbox: root.is_inbox,
      depth: 0,
    });
    for (const child of getChildFolders(folders, root.id)) {
      options.push({
        id: child.id,
        name: child.name,
        path: `${root.name} / ${child.name}`,
        isInbox: false,
        depth: 1,
      });
    }
  }
  return options;
}
