"use client";

import { NoteListItem } from "@/components/layout/NoteListItem";
import type { Note } from "@/types";

type NoteListProps = {
  notes: Note[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateNote?: () => void;
  emptyMessage?: string;
  showCreateHint?: boolean;
};

export function NoteList({
  notes,
  selectedId,
  onSelect,
  onCreateNote,
  emptyMessage = "Nothing here yet — create your first note",
  showCreateHint = false,
}: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-muted">{emptyMessage}</p>
        {showCreateHint && onCreateNote ? (
          <button
            type="button"
            onClick={onCreateNote}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors duration-fast ease-out hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            New note
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 px-2 pb-4">
      {notes.map((note, index) => (
        <div key={note.id}>
          {index > 0 ? (
            <div
              className="mx-3 border-t border-border-subtle"
              aria-hidden
            />
          ) : null}
          <NoteListItem
            note={note}
            selected={note.id === selectedId}
            onSelect={onSelect}
          />
        </div>
      ))}
    </div>
  );
}
