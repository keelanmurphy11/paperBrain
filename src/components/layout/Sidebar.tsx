"use client";

import { NewNoteButton } from "@/components/layout/NewNoteButton";
import { NoteList } from "@/components/layout/NoteList";
import { SearchTrigger } from "@/components/layout/SearchTrigger";
import { TagsSection } from "@/components/layout/TagsSection";
import { NoteListSkeleton } from "@/components/ui/Skeletons";
import type { Note } from "@/types";
import { cn } from "@/lib/utils";

type SidebarProps = {
  notes: Note[];
  selectedId: string | null;
  selectedTagId: string | null;
  onSelectNote: (id: string) => void;
  onSelectTag: (tagId: string | null) => void;
  onNewNote: () => void;
  onOpenSearch: () => void;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  creating?: boolean;
  totalNoteCount?: number;
  className?: string;
};

export function Sidebar({
  notes,
  selectedId,
  selectedTagId,
  onSelectNote,
  onSelectTag,
  onNewNote,
  onOpenSearch,
  isLoading,
  isError,
  errorMessage,
  creating,
  totalNoteCount = 0,
  className,
}: SidebarProps) {
  return (
    <aside
      className={cn("flex h-full w-full flex-col bg-background", className)}
    >
      <div className="flex flex-col gap-3 px-4 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))] md:pt-6">
        <div className="flex items-center gap-2 px-0.5">
          <span
            className="flex size-6 items-center justify-center rounded-md bg-accent text-[11px] font-semibold tracking-tight text-white"
            aria-hidden
          >
            p
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            paperBrain
          </span>
        </div>

        <NewNoteButton onClick={onNewNote} disabled={creating} />
        <SearchTrigger onClick={onOpenSearch} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <TagsSection
          selectedTagId={selectedTagId}
          onSelectTag={onSelectTag}
        />

        <p className="px-5 pb-1.5 pt-3 text-[11px] font-medium uppercase tracking-wider text-muted-subtle">
          {selectedTagId ? "Filtered" : "Recent"}
        </p>
        {isLoading ? (
          <NoteListSkeleton />
        ) : isError ? (
          <div className="px-5 py-8">
            <p className="text-sm text-danger" role="alert">
              {errorMessage ?? "Couldn’t load notes"}
            </p>
            <p className="mt-1 text-xs text-muted-subtle">
              Check your connection and refresh.
            </p>
          </div>
        ) : (
          <NoteList
            notes={notes}
            selectedId={selectedId}
            onSelect={onSelectNote}
            onCreateNote={onNewNote}
            emptyMessage={
              selectedTagId
                ? "No notes with this tag"
                : totalNoteCount === 0
                  ? "Nothing here yet — create your first note"
                  : "No notes yet"
            }
            showCreateHint={!selectedTagId && totalNoteCount === 0}
          />
        )}
      </div>
    </aside>
  );
}
