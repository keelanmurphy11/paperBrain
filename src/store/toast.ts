"use client";

import { create } from "zustand";

export type ToastVariant = "error" | "success" | "info";

export type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastState = {
  toasts: Toast[];
  push: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: string) => void;
};

let toastSeq = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  push: (message, variant = "info") => {
    const id = `toast-${++toastSeq}`;
    set((state) => ({
      toasts: [...state.toasts.slice(-4), { id, message, variant }],
    }));
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, 4200);
    }
  },

  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export function toast(
  message: string,
  variant: ToastVariant = "info"
): void {
  useToastStore.getState().push(message, variant);
}
