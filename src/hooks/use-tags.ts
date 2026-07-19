"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  addTagToNote,
  detachTagFromNote,
  fetchNoteIdsForTag,
  fetchTags,
  fetchTagsForNote,
} from "@/lib/tags-api";
import type { Tag } from "@/types";

export function tagsQueryKey() {
  return ["tags"] as const;
}

export function noteTagsQueryKey(noteId: string) {
  return ["note-tags", noteId] as const;
}

export function noteIdsForTagQueryKey(tagId: string) {
  return ["note-ids-for-tag", tagId] as const;
}

export function useTags() {
  return useQuery({
    queryKey: tagsQueryKey(),
    queryFn: fetchTags,
  });
}

export function useNoteTags(noteId: string | undefined) {
  return useQuery({
    queryKey: noteTagsQueryKey(noteId ?? ""),
    queryFn: () => fetchTagsForNote(noteId!),
    enabled: Boolean(noteId),
  });
}

export function useNoteIdsForTag(tagId: string | null) {
  return useQuery({
    queryKey: noteIdsForTagQueryKey(tagId ?? ""),
    queryFn: () => fetchNoteIdsForTag(tagId!),
    enabled: Boolean(tagId),
  });
}

export function useAddTagToNote(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => addTagToNote(noteId, name),
    onSuccess: (tag) => {
      queryClient.setQueryData<Tag[]>(noteTagsQueryKey(noteId), (prev) => {
        if (!prev) return [tag];
        if (prev.some((t) => t.id === tag.id)) return prev;
        return [...prev, tag].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
        );
      });

      queryClient.setQueryData<Tag[]>(tagsQueryKey(), (prev) => {
        if (!prev) return [tag];
        if (prev.some((t) => t.id === tag.id)) return prev;
        return [...prev, tag].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
        );
      });

      void queryClient.invalidateQueries({
        queryKey: noteIdsForTagQueryKey(tag.id),
      });
    },
  });
}

export function useDetachTagFromNote(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagId: string) => detachTagFromNote(noteId, tagId),
    onSuccess: (_data, tagId) => {
      queryClient.setQueryData<Tag[]>(noteTagsQueryKey(noteId), (prev) =>
        (prev ?? []).filter((t) => t.id !== tagId)
      );

      void queryClient.invalidateQueries({
        queryKey: noteIdsForTagQueryKey(tagId),
      });
    },
  });
}
