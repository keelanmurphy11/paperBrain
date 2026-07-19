"use client";

import { useCallback, useEffect, useState } from "react";
import type { NoteSortMode } from "@/lib/notes";

const STORAGE_KEY = "paperbrain.note-sort";

function isSortMode(value: unknown): value is NoteSortMode {
  return value === "updated" || value === "created" || value === "title";
}

export function useNoteSort(
  defaultMode: NoteSortMode = "updated"
): [NoteSortMode, (mode: NoteSortMode) => void] {
  const [mode, setModeState] = useState<NoteSortMode>(defaultMode);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isSortMode(stored)) setModeState(stored);
    } catch {
      // ignore storage errors
    }
  }, []);

  const setMode = useCallback((next: NoteSortMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }, []);

  return [mode, setMode];
}
