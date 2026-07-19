"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { notesQueryKey } from "@/hooks/use-notes";
import { sourcesQueryKey } from "@/hooks/use-sources";
import {
  submitQuickCapture,
  type QuickCaptureInput,
  type QuickCaptureResult,
} from "@/lib/quick-capture";
import type { Note, Source } from "@/types";

export function useQuickCapture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: QuickCaptureInput) => submitQuickCapture(input),
    onSuccess: (result: QuickCaptureResult) => {
      queryClient.setQueryData<Note[]>(notesQueryKey, (prev) => {
        if (!prev) return [result.note];
        return [
          result.note,
          ...prev.filter((n) => n.id !== result.note.id),
        ];
      });

      if (result.source) {
        queryClient.setQueryData<Source[]>(
          sourcesQueryKey(result.note.id),
          (prev) => {
            if (!prev) return [result.source!];
            if (prev.some((s) => s.id === result.source!.id)) return prev;
            return [...prev, result.source!];
          }
        );
      }
    },
  });
}
