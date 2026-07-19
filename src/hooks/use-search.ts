"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { searchNotes, type SearchResult } from "@/lib/search-api";
import type { FolderId } from "@/types";

export function searchQueryKey(query: string, folderId?: FolderId | null) {
  return ["search", query, folderId ?? null] as const;
}

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function useSearchNotes(
  query: string,
  enabled: boolean,
  folderId?: FolderId | null
) {
  const debouncedQuery = useDebouncedValue(query, 250);
  const trimmed = debouncedQuery.trim();

  const result = useQuery({
    queryKey: searchQueryKey(trimmed, folderId),
    queryFn: () => searchNotes(trimmed, { folderId }),
    enabled: enabled && trimmed.length > 0,
  });

  return {
    ...result,
    debouncedQuery: trimmed,
    isDebouncing: query.trim() !== trimmed,
  };
}

export type { SearchResult };
