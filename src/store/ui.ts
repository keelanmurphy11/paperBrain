"use client";

import { create } from "zustand";
import type { FolderId } from "@/types";

/** On mobile `/`, either the folder list or All Notes is the visible root pane. */
export type MobileHomePane = "folders" | "all-notes";

type UiState = {
  selectedTagId: string | null;
  lastFolderId: string | null;
  focusTitleOnOpen: boolean;
  mobileHomePane: MobileHomePane;
  mobileSearchOpen: boolean;
  mobileSearchScopeFolderId: FolderId | null;
  /** In-app push count so Back can prefer history over hard redirects. */
  inAppHistoryDepth: number;
  setSelectedTagId: (tagId: string | null) => void;
  setLastFolderId: (folderId: string | null) => void;
  setFocusTitleOnOpen: (value: boolean) => void;
  setMobileHomePane: (pane: MobileHomePane) => void;
  openMobileSearch: (scopeFolderId?: FolderId | null) => void;
  closeMobileSearch: () => void;
  pushInAppHistory: () => void;
  popInAppHistory: () => void;
  consumeFocusTitle: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  selectedTagId: null,
  lastFolderId: null,
  focusTitleOnOpen: false,
  mobileHomePane: "folders",
  mobileSearchOpen: false,
  mobileSearchScopeFolderId: null,
  inAppHistoryDepth: 0,

  setSelectedTagId: (tagId) => set({ selectedTagId: tagId }),

  setLastFolderId: (folderId) => set({ lastFolderId: folderId }),

  setFocusTitleOnOpen: (value) => set({ focusTitleOnOpen: value }),

  setMobileHomePane: (pane) => set({ mobileHomePane: pane }),

  openMobileSearch: (scopeFolderId = null) =>
    set({
      mobileSearchOpen: true,
      mobileSearchScopeFolderId: scopeFolderId,
    }),

  closeMobileSearch: () =>
    set({
      mobileSearchOpen: false,
      mobileSearchScopeFolderId: null,
    }),

  pushInAppHistory: () =>
    set((s) => ({ inAppHistoryDepth: s.inAppHistoryDepth + 1 })),

  popInAppHistory: () =>
    set((s) => ({
      inAppHistoryDepth: Math.max(0, s.inAppHistoryDepth - 1),
    })),

  consumeFocusTitle: () => set({ focusTitleOnOpen: false }),
}));
