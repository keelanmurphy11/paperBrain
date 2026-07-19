"use client";

import { Download, FileDown, FolderArchive, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFolders } from "@/hooks/use-folders";
import { useNotes } from "@/hooks/use-notes";
import {
  exportAllNotesAsZip,
  exportSingleNote,
} from "@/lib/export-notes";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast";
import { useUiStore } from "@/store/ui";

type SettingsMenuProps = {
  className?: string;
};

export function SettingsMenu({ className }: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"single" | "all" | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedNoteId = useUiStore((s) => s.selectedNoteId);
  const { data: notes = [] } = useNotes();
  const { data: folders = [] } = useFolders();
  const selectedNote =
    notes.find((n) => n.id === selectedNoteId) ?? null;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleExportCurrent() {
    if (!selectedNote) {
      toast("Open a note to export", "info");
      return;
    }
    setBusy("single");
    try {
      await exportSingleNote(selectedNote, folders);
      toast("Note exported", "success");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast(
        err instanceof Error ? err.message : "Couldn’t export note",
        "error"
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleExportAll() {
    setBusy("all");
    try {
      await exportAllNotesAsZip();
      toast("All notes exported", "success");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast(
        err instanceof Error ? err.message : "Couldn’t export notes",
        "error"
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Settings"
        className={cn(
          "flex w-full min-h-11 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-muted",
          "transition-colors duration-fast ease-out hover:bg-hover hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          open && "bg-hover text-foreground"
        )}
      >
        <Settings
          className="size-3.5 shrink-0 text-muted-subtle"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="flex-1">Settings</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-40 mb-1 w-full min-w-[14rem] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg"
        >
          <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-subtle">
            Export
          </p>
          <button
            type="button"
            role="menuitem"
            disabled={busy !== null || !selectedNote}
            onClick={() => void handleExportCurrent()}
            className={cn(
              "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors duration-fast ease-out",
              "hover:bg-hover focus-visible:bg-hover focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            <FileDown className="size-3.5 shrink-0 text-muted-subtle" strokeWidth={1.75} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-foreground">
                {busy === "single" ? "Exporting…" : "Export current note"}
              </span>
              <span className="block text-[11px] text-muted-subtle">
                Markdown (.md)
              </span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={busy !== null}
            onClick={() => void handleExportAll()}
            className={cn(
              "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors duration-fast ease-out",
              "hover:bg-hover focus-visible:bg-hover focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            <FolderArchive className="size-3.5 shrink-0 text-muted-subtle" strokeWidth={1.75} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-foreground">
                {busy === "all" ? "Building zip…" : "Export everything"}
              </span>
              <span className="block text-[11px] text-muted-subtle">
                Zip of all notes by folder
              </span>
            </span>
            <Download className="size-3.5 shrink-0 text-muted-subtle" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
