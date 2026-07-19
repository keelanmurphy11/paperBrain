"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NewNoteButton } from "@/components/layout/NewNoteButton";
import { MobilePageTransition } from "@/components/layout/MobilePageTransition";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileSearchOverlay } from "@/components/search/SidebarSearch";
import { useAppNav } from "@/hooks/use-app-nav";
import { useFolders } from "@/hooks/use-folders";
import { useCreateNote, useNotes } from "@/hooks/use-notes";
import {
  parseFolderIdFromPath,
  parseNoteIdFromPath,
  registerAppNavigate,
} from "@/lib/navigation";
import { toast } from "@/store/toast";
import { useUiStore } from "@/store/ui";
import { cn } from "@/lib/utils";
import type { FolderId } from "@/types";

type AppShellProps = {
  children: React.ReactNode;
};

/**
 * Persistent app chrome: sidebar as nav rail (always on desktop;
 * full-screen folder list on mobile at `/`), main content via App Router.
 */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: notes = [], isLoading, isError, error } = useNotes();
  const { data: folders = [] } = useFolders();
  const createNote = useCreateNote();
  const { openNote, openSearch } = useAppNav();

  const lastFolderId = useUiStore((s) => s.lastFolderId);
  const mobileHomePane = useUiStore((s) => s.mobileHomePane);
  const mobileSearchOpen = useUiStore((s) => s.mobileSearchOpen);
  const mobileSearchScopeFolderId = useUiStore(
    (s) => s.mobileSearchScopeFolderId
  );
  const setLastFolderId = useUiStore((s) => s.setLastFolderId);
  const setMobileHomePane = useUiStore((s) => s.setMobileHomePane);
  const closeMobileSearch = useUiStore((s) => s.closeMobileSearch);

  const activeFolderId = parseFolderIdFromPath(pathname);
  const isMobileFolderList =
    pathname === "/" && mobileHomePane === "folders";
  const isMobileAllNotes =
    pathname === "/" && mobileHomePane === "all-notes";

  const inboxId = useMemo(
    () => folders.find((f) => f.is_inbox)?.id ?? null,
    [folders]
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    function syncDesktopHome() {
      if (mq.matches && pathname === "/") {
        setMobileHomePane("all-notes");
      }
    }
    syncDesktopHome();
    mq.addEventListener("change", syncDesktopHome);
    return () => mq.removeEventListener("change", syncDesktopHome);
  }, [pathname, setMobileHomePane]);

  useEffect(() => {
    if (activeFolderId) {
      setLastFolderId(activeFolderId);
      return;
    }
    if (!lastFolderId && inboxId) {
      setLastFolderId(inboxId);
    }
  }, [activeFolderId, inboxId, lastFolderId, setLastFolderId]);

  useEffect(() => {
    registerAppNavigate((href) => {
      useUiStore.getState().pushInAppHistory();
      router.push(href);
    });
    return () => registerAppNavigate(null);
  }, [router]);

  // Keep in-app depth honest when the browser Back/Forward buttons are used
  useEffect(() => {
    function onPopState() {
      useUiStore.getState().popInAppHistory();
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const createBlankNote = useCallback(
    async (folderId?: FolderId | null) => {
      // Cmd+N: open folder → that folder; note page → note's folder;
      // All Notes / no folder → Inbox
      const noteId = parseNoteIdFromPath(pathname);
      const noteFolderId = noteId
        ? notes.find((n) => n.id === noteId)?.folder_id ?? null
        : null;
      const onAllNotes = pathname === "/";
      const targetFolderId =
        folderId ??
        activeFolderId ??
        noteFolderId ??
        (onAllNotes ? inboxId : null) ??
        lastFolderId ??
        inboxId ??
        undefined;
      try {
        const note = await createNote.mutateAsync({
          folderId: targetFolderId,
        });
        if (targetFolderId) setLastFolderId(targetFolderId);
        openNote(note.id, { focusTitle: true });
      } catch (err) {
        console.error("Failed to create note", err);
        toast("Couldn’t create note. Try again.", "error");
      }
    },
    [
      pathname,
      notes,
      activeFolderId,
      lastFolderId,
      inboxId,
      createNote,
      setLastFolderId,
      openNote,
    ]
  );

  const handleNewNote = useCallback(() => {
    void createBlankNote();
  }, [createBlankNote]);

  const handleNewNoteInFolder = useCallback(
    (folderId: FolderId) => {
      void createBlankNote(folderId);
    },
    [createBlankNote]
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      const mod = event.metaKey || event.ctrlKey;

      // Escape for search is handled by SidebarSearch / MobileSearchOverlay
      // (clear query first, then exit) so AppShell must not steal it.

      if (!mod) return;

      // ⌘K always focuses search (even from editor — intentional)
      if (key === "k") {
        event.preventDefault();
        openSearch();
        return;
      }

      // ⌘N: skip when typing in inputs (except we still allow from editor body)
      if (key === "n") {
        const target = event.target;
        if (
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement
        ) {
          return;
        }
        event.preventDefault();
        handleNewNote();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openSearch, handleNewNote]);

  useEffect(() => {
    if (!isError) return;
    toast(
      error instanceof Error ? error.message : "Couldn’t load notes",
      "error"
    );
  }, [isError, error]);

  const sidebarProps = {
    notes,
    isMobileFolderList,
    onNewNoteInFolder: handleNewNoteInFolder,
    isLoading,
    isError,
    errorMessage: error instanceof Error ? error.message : undefined,
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <div className="hidden h-full w-sidebar shrink-0 border-r border-border-subtle md:flex">
        <Sidebar {...sidebarProps} />
      </div>

      <div
        className={cn(
          "h-full w-full md:hidden",
          isMobileFolderList ? "flex" : "hidden"
        )}
      >
        <Sidebar {...sidebarProps} />
      </div>

      <div
        className={cn(
          "min-w-0 flex-1",
          isMobileFolderList ? "hidden md:flex" : "flex"
        )}
      >
        <MobilePageTransition
          className="w-full"
          forceKey={isMobileAllNotes ? "all-notes" : undefined}
        >
          {children}
        </MobilePageTransition>
      </div>

      <NewNoteButton variant="fab" onClick={handleNewNote} />

      <MobileSearchOverlay
        open={mobileSearchOpen}
        onClose={closeMobileSearch}
        initialScopeFolderId={mobileSearchScopeFolderId ?? activeFolderId}
      />
    </div>
  );
}
