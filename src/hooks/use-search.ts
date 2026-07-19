"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { searchNotes, type SearchResult } from "@/lib/search-api";

export function searchQueryKey(query: string) {
  return ["search", query] as const;
}

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function useSearchNotes(query: string, enabled: boolean) {
  const debouncedQuery = useDebouncedValue(query, 250);
  const trimmed = debouncedQuery.trim();

  const result = useQuery({
    queryKey: searchQueryKey(trimmed),
    queryFn: () => searchNotes(trimmed),
    enabled: enabled && trimmed.length > 0,
  });

  return {
    ...result,
    debouncedQuery: trimmed,
    isDebouncing: query.trim() !== trimmed,
  };
}

export type { SearchResult };
