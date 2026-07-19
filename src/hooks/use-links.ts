"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchBacklinks,
  syncOutgoingLinks,
  type Backlink,
} from "@/lib/links-api";

export function backlinksQueryKey(noteId: string) {
  return ["backlinks", noteId] as const;
}

export function useBacklinks(noteId: string | undefined) {
  return useQuery({
    queryKey: backlinksQueryKey(noteId ?? ""),
    queryFn: () => fetchBacklinks(noteId!),
    enabled: Boolean(noteId),
  });
}

export function useSyncOutgoingLinks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sourceNoteId,
      targetIds,
    }: {
      sourceNoteId: string;
      targetIds: string[];
    }) => syncOutgoingLinks(sourceNoteId, targetIds),
    onSuccess: (result) => {
      const affected = result.added.concat(result.removed);
      for (const targetId of affected) {
        void queryClient.invalidateQueries({
          queryKey: backlinksQueryKey(targetId),
        });
      }
    },
  });
}

export type { Backlink };
