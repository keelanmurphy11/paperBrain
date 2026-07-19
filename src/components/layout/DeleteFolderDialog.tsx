"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { DeleteFolderMode } from "@/lib/folders-api";
import { cn } from "@/lib/utils";

type DeleteFolderDialogProps = {
  open: boolean;
  folderName: string;
  noteCount: number;
  busy?: boolean;
  onConfirm: (mode: DeleteFolderMode) => void;
  onCancel: () => void;
};

export function DeleteFolderDialog({
  open,
  folderName,
  noteCount,
  busy,
  onConfirm,
  onCancel,
}: DeleteFolderDialogProps) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [mode, setMode] = useState<DeleteFolderMode>("move_to_inbox");

  useEffect(() => {
    if (!open) return;
    setMode("move_to_inbox");
    cancelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const label = folderName.trim() || "Untitled";
  const hasNotes = noteCount > 0;

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
              Delete folder?
            </h2>
            <p className="text-sm text-muted">
              “{label}” and any subfolders will be removed.
            </p>
          </div>
        </div>

        {hasNotes ? (
          <fieldset className="mt-4 space-y-2">
            <legend className="text-xs font-medium text-muted">
              {noteCount} note{noteCount === 1 ? "" : "s"} in this folder
            </legend>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-hover">
              <input
                type="radio"
                name="delete-folder-mode"
                checked={mode === "move_to_inbox"}
                onChange={() => setMode("move_to_inbox")}
                className="mt-0.5 accent-[var(--color-accent)]"
              />
              <span className="text-sm text-foreground">
                Move notes to Inbox
                <span className="mt-0.5 block text-xs text-muted-subtle">
                  Recommended — keeps your notes safe
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-hover">
              <input
                type="radio"
                name="delete-folder-mode"
                checked={mode === "delete_notes"}
                onChange={() => setMode("delete_notes")}
                className="mt-0.5 accent-[var(--color-accent)]"
              />
              <span className="text-sm text-foreground">
                Delete notes too
                <span className="mt-0.5 block text-xs text-muted-subtle">
                  Permanently deletes contained notes
                </span>
              </span>
            </label>
          </fieldset>
        ) : null}

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
            onClick={() => onConfirm(mode)}
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
