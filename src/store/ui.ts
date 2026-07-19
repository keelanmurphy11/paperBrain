"use client";

import { create } from "zustand";

export type MobileView = "list" | "editor";

type UiState = {
  selectedNoteId: string | null;
  selectedTagId: string | null;
  /** Folder used as the default destination for new notes (Inbox if null). */
  activeFolderId: string | null;
  mobileView: MobileView;
  focusTitleOnOpen: boolean;
  searchOpen: boolean;
  quickCaptureOpen: boolean;
  templatePickerOpen: boolean;
  /** Folder to create into when the template picker confirms. */
  templatePickerFolderId: string | null;
  selectNote: (id: string) => void;
  clearSelection: () => void;
  openNewNote: (id: string, options?: { focusTitle?: boolean }) => void;
  setSelectedTagId: (tagId: string | null) => void;
  setActiveFolderId: (folderId: string | null) => void;
  setMobileView: (view: MobileView) => void;
  goBackToList: () => void;
  consumeFocusTitle: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  openQuickCapture: () => void;
  closeQuickCapture: () => void;
  openTemplatePicker: (folderId?: string | null) => void;
  closeTemplatePicker: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  selectedNoteId: null,
  selectedTagId: null,
  activeFolderId: null,
  mobileView: "list",
  focusTitleOnOpen: false,
  searchOpen: false,
  quickCaptureOpen: false,
  templatePickerOpen: false,
  templatePickerFolderId: null,

  selectNote: (id) =>
    set({
      selectedNoteId: id,
      mobileView: "editor",
      focusTitleOnOpen: false,
    }),

  clearSelection: () =>
    set({
      selectedNoteId: null,
      focusTitleOnOpen: false,
    }),

  openNewNote: (id, options) =>
    set({
      selectedNoteId: id,
      mobileView: "editor",
      focusTitleOnOpen: options?.focusTitle ?? true,
    }),

  setSelectedTagId: (tagId) => set({ selectedTagId: tagId }),

  setActiveFolderId: (folderId) => set({ activeFolderId: folderId }),

  setMobileView: (view) => set({ mobileView: view }),

  goBackToList: () => set({ mobileView: "list" }),

  consumeFocusTitle: () => set({ focusTitleOnOpen: false }),

  openSearch: () =>
    set({
      searchOpen: true,
      quickCaptureOpen: false,
      templatePickerOpen: false,
    }),

  closeSearch: () => set({ searchOpen: false }),

  openQuickCapture: () =>
    set({
      quickCaptureOpen: true,
      searchOpen: false,
      templatePickerOpen: false,
    }),

  closeQuickCapture: () => set({ quickCaptureOpen: false }),

  openTemplatePicker: (folderId = null) =>
    set({
      templatePickerOpen: true,
      templatePickerFolderId: folderId ?? null,
      searchOpen: false,
      quickCaptureOpen: false,
    }),

  closeTemplatePicker: () =>
    set({
      templatePickerOpen: false,
      templatePickerFolderId: null,
    }),
}));
