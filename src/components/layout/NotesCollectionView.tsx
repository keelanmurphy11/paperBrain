"use client";

import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FolderOverflowMenu } from "@/components/layout/FolderOverflowMenu";
import { MobileBackHeader } from "@/components/layout/MobileBackHeader";
import { NoteList } from "@/components/layout/NoteList";
import { NoteSortControl } from "@/components/layout/NoteSortControl";
import { SubfolderSection } from "@/components/layout/SubfolderSection";
import { NoteListSkeleton } from "@/components/ui/Skeletons";
import { useAppNav } from "@/hooks/use-app-nav";
import { useNoteSort } from "@/hooks/use-note-sort";
import { parseNoteIdFromPath } from "@/lib/navigation";
import { sortNotes } from "@/lib/notes";
import type { Folder, Note } from "@/types";
import { cn } from "@/lib/utils";

type NotesCollectionViewProps = {
  title: string;
  notes: Note[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  emptyMessage: string;
  onCreateNote: () => void;
  creating?: boolean;
  onBack?: () => void;
  backLabel?: string;
  /** Parent crumb for subfolders — clickable to navigate up. */
  breadcrumb?: { id: string; name: string } | null;
  subfolders?: Folder[];
  /** All notes (used for subfolder counts). Defaults to `notes`. */
  allNotesForCounts?: Note[];
  /** Show rename/delete overflow near the title. */
  folderActions?: {
    canMutate: boolean;
    onRename: (name: string) => Promise<void> | void;
    onDelete: () => void;
  } | null;
  /** Optional meta under each row (e.g. folder path on All Notes). */
  getNoteMeta?: (note: Note) => string | null | undefined;
  /** When set, meta line becomes a clickable folder link. */
  onNoteMetaClick?: (note: Note) => void;
  headerExtra?: ReactNode;
  className?: string;
};
/**
 * Shared shell for Folder View and All Notes — intentional header, sort,
 * subfolders, and Apple Notes–style list.
 */
export function NotesCollectionView({
  title,
  notes,
  isLoading,
  isError,
  errorMessage,
  emptyMessage,
  onCreateNote,
  creating,
  onBack,
  backLabel = "Folders",
  breadcrumb,
  subfolders = [],
  allNotesForCounts,
  folderActions,
  getNoteMeta,
  onNoteMetaClick,
  headerExtra,
  className,
}: NotesCollectionViewProps) {
  const { openNote, openFolder } = useAppNav();
  const pathname = usePathname();
  const selectedNoteId = parseNoteIdFromPath(pathname);
  const [sortMode, setSortMode] = useNoteSort("updated");
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(title);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!renaming) setRenameValue(title);
  }, [title, renaming]);

  useEffect(() => {
    if (!renaming) return;
    renameRef.current?.focus();
    renameRef.current?.select();
  }, [renaming]);

  const sortedNotes = useMemo(
    () => sortNotes(notes, sortMode),
    [notes, sortMode]
  );

  const noteCountLabel =
    notes.length === 1 ? "1 note" : `${notes.length} notes`;

  const countNotes = allNotesForCounts ?? notes;
  const isEmpty =
    !isLoading &&
    !isError &&
    sortedNotes.length === 0 &&
    subfolders.length === 0;

  async function commitRename() {
    if (!folderActions) {
      setRenaming(false);
      return;
    }
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === title) {
      setRenaming(false);
      setRenameValue(title);
      return;
    }
    try {
      await folderActions.onRename(trimmed);
      setRenaming(false);
    } catch {
      // Caller toasts; keep editing open so the user can retry
    }
  }

  return (
    <section
      className={cn(
        "flex h-full min-h-0 w-full flex-col bg-surface",
        className
      )}
    >
      <header className="shrink-0 border-b border-border-subtle pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="flex min-h-11 items-center gap-1 px-2 md:px-4 md:pt-2">
          {onBack ? (
            <MobileBackHeader onBack={onBack} label={backLabel} />
          ) : (
            <div className="hidden md:block" />
          )}
          <div className="ml-auto flex items-center gap-0.5 pr-1">
            <NoteSortControl value={sortMode} onChange={setSortMode} />
            {folderActions ? (
              <FolderOverflowMenu
                canMutate={folderActions.canMutate}
                onRename={() => setRenaming(true)}
                onDelete={folderActions.onDelete}
              />
            ) : null}
            {headerExtra}
          </div>
        </div>

        <div className="px-4 pb-4 pt-1 md:px-6 md:pb-5 md:pt-2">
          {breadcrumb && !isLoading ? (
            <nav
              aria-label="Folder breadcrumb"
              className="mb-1.5 flex min-w-0 items-center gap-1.5 text-[13px] text-muted"
            >
              <button
                type="button"
                onClick={() => openFolder(breadcrumb.id)}
                className="truncate transition-colors duration-fast ease-out hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                {breadcrumb.name}
              </button>
              <span className="shrink-0 text-muted-subtle" aria-hidden>
                /
              </span>
              <span className="truncate text-muted-subtle">{title}</span>
            </nav>
          ) : null}

          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              {isLoading ? (
                <>
                  <div className="h-8 w-2/5 max-w-[14rem] animate-pulse rounded bg-border-subtle" />
                  <div className="mt-2 h-4 w-16 animate-pulse rounded bg-border-subtle" />
                </>
              ) : renaming ? (
                <input
                  ref={renameRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => void commitRename()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void commitRename();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setRenaming(false);
                      setRenameValue(title);
                    }
                  }}
                  aria-label="Rename folder"
                  className="w-full rounded-md border border-border bg-background px-2 py-1 text-title text-foreground outline-none focus:ring-2 focus:ring-accent/30"
                />
              ) : (
                <h1 className="truncate text-title tracking-tight text-foreground">
                  {title}
                </h1>
              )}
              {!isLoading ? (
                <p className="mt-1 text-sm text-muted">{noteCountLabel}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onCreateNote}
              disabled={creating || isLoading}
              className={cn(
                "mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2.5 text-sm font-medium text-white",
                "transition-colors duration-fast ease-out hover:bg-accent-hover",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
                "disabled:pointer-events-none disabled:opacity-60"
              )}
            >
              <Plus className="size-4" strokeWidth={2} aria-hidden />
              New note
            </button>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {isLoading ? (
          <div className="px-2 pt-2 md:px-4">
            <NoteListSkeleton />
          </div>
        ) : isError ? (
          <div className="px-5 py-10">
            <p className="text-sm text-danger" role="alert">
              {errorMessage ?? "Couldn’t load notes"}
            </p>
          </div>
        ) : isEmpty ? (
          <EmptyCollectionState
            message={emptyMessage}
            onCreateNote={onCreateNote}
            creating={creating}
          />
        ) : (
          <>
            <SubfolderSection
              subfolders={subfolders}
              notes={countNotes}
              onSelect={openFolder}
              className="pt-4"
            />
            {sortedNotes.length > 0 ? (
              <div>
                {subfolders.length > 0 ? (
                  <p className="px-4 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wider text-muted-subtle md:px-6">
                    Notes
                  </p>
                ) : null}
                <NoteList
                  notes={sortedNotes}
                  selectedId={selectedNoteId}
                  onSelect={openNote}
                  getMeta={getNoteMeta}
                  onMetaClick={onNoteMetaClick}
                />
              </div>
            ) : subfolders.length > 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-subtle">
                {emptyMessage}
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

function EmptyCollectionState({
  message,
  onCreateNote,
  creating,
}: {
  message: string;
  onCreateNote: () => void;
  creating?: boolean;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <p className="max-w-xs text-sm text-muted">{message}</p>
      <button
        type="button"
        onClick={onCreateNote}
        disabled={creating}
        className={cn(
          "mt-5 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-medium text-white",
          "transition-colors duration-fast ease-out hover:bg-accent-hover",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
          "disabled:pointer-events-none disabled:opacity-60"
        )}
      >
        <Plus className="size-4" strokeWidth={2} aria-hidden />
        New note
      </button>
    </div>
  );
}
