"use client";

import { useCallback, useEffect, useMemo } from "react";
import { QuickCaptureOverlay } from "@/components/capture/QuickCaptureOverlay";
import { NoteEditor } from "@/components/editor/NoteEditor";
import { NewNoteButton } from "@/components/layout/NewNoteButton";
import { Sidebar } from "@/components/layout/Sidebar";
import { TemplatePicker } from "@/components/layout/TemplatePicker";
import { SearchPalette } from "@/components/search/SearchPalette";
import { NoteEditorSkeleton } from "@/components/ui/Skeletons";
import { useFolders } from "@/hooks/use-folders";
import { useCreateNote, useNotes } from "@/hooks/use-notes";
import { useNoteIdsForTag } from "@/hooks/use-tags";
import { getTemplateContent, type NoteTemplateId } from "@/lib/note-templates";
import { toast } from "@/store/toast";
import { useUiStore } from "@/store/ui";
import { cn } from "@/lib/utils";
import type { FolderId } from "@/types";

export function AppShell() {
  const { data: notes = [], isLoading, isError, error, isSuccess } = useNotes();
  const { data: folders = [] } = useFolders();
  const createNote = useCreateNote();

  const selectedNoteId = useUiStore((s) => s.selectedNoteId);
  const selectedTagId = useUiStore((s) => s.selectedTagId);
  const activeFolderId = useUiStore((s) => s.activeFolderId);
  const mobileView = useUiStore((s) => s.mobileView);
  const searchOpen = useUiStore((s) => s.searchOpen);
  const quickCaptureOpen = useUiStore((s) => s.quickCaptureOpen);
  const templatePickerOpen = useUiStore((s) => s.templatePickerOpen);
  const templatePickerFolderId = useUiStore((s) => s.templatePickerFolderId);
  const selectNote = useUiStore((s) => s.selectNote);
  const setSelectedTagId = useUiStore((s) => s.setSelectedTagId);
  const setActiveFolderId = useUiStore((s) => s.setActiveFolderId);
  const openNewNote = useUiStore((s) => s.openNewNote);
  const goBackToList = useUiStore((s) => s.goBackToList);
  const openSearch = useUiStore((s) => s.openSearch);
  const closeSearch = useUiStore((s) => s.closeSearch);
  const openQuickCapture = useUiStore((s) => s.openQuickCapture);
  const closeQuickCapture = useUiStore((s) => s.closeQuickCapture);
  const openTemplatePicker = useUiStore((s) => s.openTemplatePicker);
  const closeTemplatePicker = useUiStore((s) => s.closeTemplatePicker);

  const { data: taggedNoteIds, isLoading: tagFilterLoading } =
    useNoteIdsForTag(selectedTagId);

  const inboxId = useMemo(
    () => folders.find((f) => f.is_inbox)?.id ?? null,
    [folders]
  );

  // Default active folder to Inbox; reset if the active folder was deleted
  useEffect(() => {
    if (!inboxId) return;
    if (!activeFolderId) {
      setActiveFolderId(inboxId);
      return;
    }
    if (
      folders.length > 0 &&
      !folders.some((f) => f.id === activeFolderId)
    ) {
      setActiveFolderId(inboxId);
    }
  }, [activeFolderId, folders, inboxId, setActiveFolderId]);

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

  const handleNewNote = useCallback(() => {
    // Full New Note flow — pick an optional template first (Inbox by default)
    openTemplatePicker(inboxId);
  }, [inboxId, openTemplatePicker]);

  const handleNewNoteInFolder = useCallback(
    (folderId: FolderId) => {
      openTemplatePicker(folderId);
    },
    [openTemplatePicker]
  );

  const handleTemplateSelect = useCallback(
    async (templateId: NoteTemplateId) => {
      const folderId =
        templatePickerFolderId ?? activeFolderId ?? inboxId ?? undefined;
      const scaffold = getTemplateContent(templateId);

      try {
        const note = await createNote.mutateAsync({
          folderId,
          content: scaffold.content,
          content_text: scaffold.content_text,
          templateType: scaffold.template_type,
        });
        if (folderId) setActiveFolderId(folderId);
        closeTemplatePicker();
        // Fact scaffold: land in the body; blank: focus title as before
        openNewNote(note.id, { focusTitle: templateId === "blank" });
      } catch (err) {
        console.error("Failed to create note", err);
        toast("Couldn’t create note. Try again.", "error");
      }
    },
    [
      templatePickerFolderId,
      activeFolderId,
      inboxId,
      createNote,
      setActiveFolderId,
      closeTemplatePicker,
      openNewNote,
    ]
  );

  // Global shortcuts: ⌘K search, ⌘N new note, ⌘⇧N quick capture, Escape closes overlays
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      const mod = event.metaKey || event.ctrlKey;
      const shift = event.shiftKey;

      if (key === "escape") {
        const state = useUiStore.getState();
        if (state.templatePickerOpen) {
          event.preventDefault();
          closeTemplatePicker();
          return;
        }
        if (state.quickCaptureOpen) {
          event.preventDefault();
          closeQuickCapture();
          return;
        }
        if (state.searchOpen) {
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

      if (key === "n" && shift) {
        event.preventDefault();
        openQuickCapture();
        return;
      }

      if (key === "n") {
        event.preventDefault();
        handleNewNote();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    openSearch,
    closeSearch,
    handleNewNote,
    openQuickCapture,
    closeQuickCapture,
    closeTemplatePicker,
  ]);

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
    activeFolderId,
    onSelectNote: selectNote,
    onSelectTag: setSelectedTagId,
    onSelectFolder: setActiveFolderId,
    onNewNote: handleNewNote,
    onNewNoteInFolder: handleNewNoteInFolder,
    onOpenSearch: openSearch,
    onOpenQuickCapture: openQuickCapture,
    isLoading: listLoading,
    isError,
    errorMessage: error instanceof Error ? error.message : undefined,
    creating: createNote.isPending,
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
            onCreateNote={handleNewNote}
          />
        )}
      </div>

      {/* Always available on mobile — capture without leaving the current note */}
      <NewNoteButton
        variant="fab-capture"
        onClick={openQuickCapture}
      />

      <SearchPalette
        open={searchOpen}
        onClose={closeSearch}
        onSelectNote={selectNote}
      />

      <QuickCaptureOverlay
        open={quickCaptureOpen}
        onClose={closeQuickCapture}
      />

      <TemplatePicker
        open={templatePickerOpen}
        busy={createNote.isPending}
        onSelect={(id) => void handleTemplateSelect(id)}
        onCancel={closeTemplatePicker}
      />
    </div>
  );
}
