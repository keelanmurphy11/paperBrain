"use client";

import { create } from "zustand";

export type MobileView = "list" | "editor";

type UiState = {
  selectedNoteId: string | null;
  selectedTagId: string | null;
  mobileView: MobileView;
  focusTitleOnOpen: boolean;
  searchOpen: boolean;
  selectNote: (id: string) => void;
  clearSelection: () => void;
  openNewNote: (id: string) => void;
  setSelectedTagId: (tagId: string | null) => void;
  setMobileView: (view: MobileView) => void;
  goBackToList: () => void;
  consumeFocusTitle: () => void;
  openSearch: () => void;
  closeSearch: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  selectedNoteId: null,
  selectedTagId: null,
  mobileView: "list",
  focusTitleOnOpen: false,
  searchOpen: false,

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

  openNewNote: (id) =>
    set({
      selectedNoteId: id,
      mobileView: "editor",
      focusTitleOnOpen: true,
    }),

  setSelectedTagId: (tagId) => set({ selectedTagId: tagId }),

  setMobileView: (view) => set({ mobileView: view }),

  goBackToList: () => set({ mobileView: "list" }),

  consumeFocusTitle: () => set({ focusTitleOnOpen: false }),

  openSearch: () => set({ searchOpen: true }),

  closeSearch: () => set({ searchOpen: false }),
}));
