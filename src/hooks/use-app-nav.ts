"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  folderPath,
  HOME_PATH,
  notePath,
  notePathWithFocus,
  parseFolderIdFromPath,
  parseNoteIdFromPath,
} from "@/lib/navigation";
import { requestSearchFocus } from "@/lib/search-focus";
import { notesQueryKey } from "@/hooks/use-notes";
import { useUiStore } from "@/store/ui";
import type { Note } from "@/types";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable='true']"));
}

export { isTypingTarget };

/** Typed navigation helpers bound to the Next.js App Router. */
export function useAppNav() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setFocusTitleOnOpen = useUiStore((s) => s.setFocusTitleOnOpen);
  const setLastFolderId = useUiStore((s) => s.setLastFolderId);
  const setMobileHomePane = useUiStore((s) => s.setMobileHomePane);
  const openMobileSearch = useUiStore((s) => s.openMobileSearch);
  const pushInAppHistory = useUiStore((s) => s.pushInAppHistory);

  const push = useCallback(
    (href: string) => {
      pushInAppHistory();
      router.push(href);
    },
    [router, pushInAppHistory]
  );

  const openNote = useCallback(
    (noteId: string, options?: { focusTitle?: boolean }) => {
      if (options?.focusTitle) {
        setFocusTitleOnOpen(true);
        push(notePathWithFocus(noteId));
      } else {
        push(notePath(noteId));
      }
    },
    [push, setFocusTitleOnOpen]
  );

  const openFolder = useCallback(
    (folderId: string) => {
      setLastFolderId(folderId);
      setMobileHomePane("folders");
      push(folderPath(folderId));
    },
    [push, setLastFolderId, setMobileHomePane]
  );

  const openSearch = useCallback(() => {
    const pathname =
      typeof window !== "undefined" ? window.location.pathname : "";
    let scope = parseFolderIdFromPath(pathname);

    // From a note page, scope to that note's folder when known
    if (!scope) {
      const noteId = parseNoteIdFromPath(pathname);
      if (noteId) {
        const notes = queryClient.getQueryData<Note[]>(notesQueryKey);
        const note = notes?.find((n) => n.id === noteId);
        scope = note?.folder_id ?? null;
      }
    }

    const isDesktop =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches;
    const onFolderList =
      pathname === "/" && useUiStore.getState().mobileHomePane === "folders";

    if (isDesktop || onFolderList) {
      requestSearchFocus({ scopeFolderId: scope });
    } else {
      openMobileSearch(scope);
    }
  }, [openMobileSearch, queryClient]);

  const openHome = useCallback(() => {
    setMobileHomePane("folders");
    push(HOME_PATH);
  }, [push, setMobileHomePane]);

  const openAllNotes = useCallback(() => {
    setMobileHomePane("all-notes");
    push(HOME_PATH);
  }, [push, setMobileHomePane]);

  const goBack = useCallback(
    (fallbackHref?: string) => {
      // Depth is decremented by the popstate listener in AppShell — do not
      // pop here or UI Back + browser Back would double-decrement.
      const depth = useUiStore.getState().inAppHistoryDepth;
      if (depth > 0) {
        router.back();
        return;
      }
      router.replace(fallbackHref ?? HOME_PATH);
    },
    [router]
  );

  return {
    openNote,
    openFolder,
    openSearch,
    openHome,
    openAllNotes,
    goBack,
    router,
  };
}
