"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

type DeleteNoteDialogProps = {
  open: boolean;
  noteTitle: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteNoteDialog({
  open,
  noteTitle,
  busy,
  onConfirm,
  onCancel,
}: DeleteNoteDialogProps) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const label = noteTitle.trim() || "Untitled";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 shadow-lg"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-danger-subtle text-danger">
            <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0 space-y-1">
            <h2 id={titleId} className="text-sm font-medium text-foreground">
              Delete note?
            </h2>
            <p className="text-sm text-muted">
              “{label}” will be permanently deleted.
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className={cn(
              "inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-foreground transition-colors duration-fast ease-out",
              "hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={cn(
              "inline-flex min-h-11 items-center rounded-lg bg-danger px-3 text-sm font-medium text-white transition-opacity duration-fast ease-out",
              "hover:opacity-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
            )}
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
