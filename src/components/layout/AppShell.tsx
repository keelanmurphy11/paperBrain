"use client";

import { useCallback, useEffect, useMemo } from "react";
import { NoteEditor } from "@/components/editor/NoteEditor";
import { NewNoteButton } from "@/components/layout/NewNoteButton";
import { Sidebar } from "@/components/layout/Sidebar";
import { SearchPalette } from "@/components/search/SearchPalette";
import { NoteEditorSkeleton } from "@/components/ui/Skeletons";
import { useCreateNote, useNotes } from "@/hooks/use-notes";
import { useNoteIdsForTag } from "@/hooks/use-tags";
import { toast } from "@/store/toast";
import { useUiStore } from "@/store/ui";
import { cn } from "@/lib/utils";

export function AppShell() {
  const { data: notes = [], isLoading, isError, error, isSuccess } = useNotes();
  const createNote = useCreateNote();

  const selectedNoteId = useUiStore((s) => s.selectedNoteId);
  const selectedTagId = useUiStore((s) => s.selectedTagId);
  const mobileView = useUiStore((s) => s.mobileView);
  const searchOpen = useUiStore((s) => s.searchOpen);
  const selectNote = useUiStore((s) => s.selectNote);
  const setSelectedTagId = useUiStore((s) => s.setSelectedTagId);
  const openNewNote = useUiStore((s) => s.openNewNote);
  const goBackToList = useUiStore((s) => s.goBackToList);
  const openSearch = useUiStore((s) => s.openSearch);
  const closeSearch = useUiStore((s) => s.closeSearch);

  const { data: taggedNoteIds, isLoading: tagFilterLoading } =
    useNoteIdsForTag(selectedTagId);

  const filteredNotes = useMemo(() => {
    if (!selectedTagId) return notes;
    if (!taggedNoteIds) return [];
    const allowed = new Set(taggedNoteIds);
    return notes.filter((note) => allowed.has(note.id));
  }, [notes, selectedTagId, taggedNoteIds]);

  // On desktop, open the most recent note once notes first load
  useEffect(() => {
    if (!isSuccess || selectedNoteId || notes.length === 0) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches
    ) {
      selectNote(notes[0].id);
    }
  }, [isSuccess, notes, selectedNoteId, selectNote]);

  const handleNewNote = useCallback(async () => {
    try {
      const note = await createNote.mutateAsync();
      openNewNote(note.id);
    } catch (err) {
      console.error("Failed to create note", err);
      toast("Couldn’t create note. Try again.", "error");
    }
  }, [createNote, openNewNote]);

  // Global shortcuts: Cmd/Ctrl+K search, Cmd/Ctrl+N new note, Escape closes overlays
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      const mod = event.metaKey || event.ctrlKey;

      if (key === "escape") {
        if (useUiStore.getState().searchOpen) {
          event.preventDefault();
          closeSearch();
        }
        return;
      }

      if (!mod) return;

      if (key === "k") {
        event.preventDefault();
        if (useUiStore.getState().searchOpen) {
          closeSearch();
        } else {
          openSearch();
        }
        return;
      }

      if (key === "n") {
        event.preventDefault();
        void handleNewNote();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openSearch, closeSearch, handleNewNote]);

  useEffect(() => {
    if (!isError) return;
    toast(
      error instanceof Error ? error.message : "Couldn’t load notes",
      "error"
    );
  }, [isError, error]);

  const selectedNote =
    notes.find((note) => note.id === selectedNoteId) ?? null;

  const listLoading = isLoading || (Boolean(selectedTagId) && tagFilterLoading);
  const editorLoading = isLoading && !selectedNote;

  const sidebarProps = {
    notes: filteredNotes,
    selectedId: selectedNoteId,
    selectedTagId,
    onSelectNote: selectNote,
    onSelectTag: setSelectedTagId,
    onNewNote: () => void handleNewNote(),
    onOpenSearch: openSearch,
    isLoading: listLoading,
    isError,
    errorMessage: error instanceof Error ? error.message : undefined,
    creating: createNote.isPending,
    totalNoteCount: notes.length,
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <div className="hidden h-full w-sidebar shrink-0 border-r border-border-subtle md:flex">
        <Sidebar {...sidebarProps} />
      </div>

      <div
        className={cn(
          "h-full w-full md:hidden",
          mobileView === "list" ? "flex" : "hidden"
        )}
      >
        <Sidebar {...sidebarProps} />
        <NewNoteButton
          variant="fab"
          onClick={() => void handleNewNote()}
        />
      </div>

      <div
        className={cn(
          "min-w-0 flex-1",
          mobileView === "editor" ? "flex" : "hidden md:flex"
        )}
      >
        {editorLoading ? (
          <NoteEditorSkeleton className="w-full" />
        ) : (
          <NoteEditor
            note={selectedNote}
            showBack
            onBack={goBackToList}
            className="w-full"
            onCreateNote={() => void handleNewNote()}
          />
        )}
      </div>

      <SearchPalette
        open={searchOpen}
        onClose={closeSearch}
        onSelectNote={selectNote}
      />
    </div>
  );
}
