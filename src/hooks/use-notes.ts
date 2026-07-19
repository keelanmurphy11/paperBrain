"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createNote,
  deleteNote,
  fetchNotes,
  updateNote,
  type CreateNoteOptions,
  type UpdateNotePayload,
} from "@/lib/notes-api";
import type { Note } from "@/types";

export const notesQueryKey = ["notes"] as const;

export function useNotes() {
  return useQuery({
    queryKey: notesQueryKey,
    queryFn: fetchNotes,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: CreateNoteOptions | void) =>
      createNote(options ?? {}),
    onSuccess: (note) => {
      queryClient.setQueryData<Note[]>(notesQueryKey, (prev) => {
        if (!prev) return [note];
        return [note, ...prev.filter((n) => n.id !== note.id)];
      });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateNotePayload }) =>
      updateNote(id, payload),
    onSuccess: (note) => {
      queryClient.setQueryData<Note[]>(notesQueryKey, (prev) => {
        if (!prev) return [note];
        const next = prev.map((n) => (n.id === note.id ? note : n));
        return next.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNote,
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Note[]>(notesQueryKey, (prev) =>
        (prev ?? []).filter((n) => n.id !== id)
      );
    },
  });
}
