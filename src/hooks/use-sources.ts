"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createSource,
  deleteSource,
  fetchSourcesForNote,
  type CreateSourcePayload,
} from "@/lib/sources-api";
import type { Source } from "@/types";

export function sourcesQueryKey(noteId: string) {
  return ["sources", noteId] as const;
}

export function useNoteSources(noteId: string | undefined) {
  return useQuery({
    queryKey: sourcesQueryKey(noteId ?? ""),
    queryFn: () => fetchSourcesForNote(noteId!),
    enabled: Boolean(noteId),
  });
}

export function useCreateSource(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<CreateSourcePayload, "noteId">) =>
      createSource({ ...payload, noteId }),
    onSuccess: (source) => {
      queryClient.setQueryData<Source[]>(sourcesQueryKey(noteId), (prev) => {
        if (!prev) return [source];
        if (prev.some((s) => s.id === source.id)) return prev;
        return [...prev, source];
      });
    },
  });
}

export function useDeleteSource(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSource,
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Source[]>(sourcesQueryKey(noteId), (prev) =>
        (prev ?? []).filter((s) => s.id !== id)
      );
    },
  });
}
