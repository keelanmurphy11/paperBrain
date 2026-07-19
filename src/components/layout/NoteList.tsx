"use client";

import { NoteListItem } from "@/components/layout/NoteListItem";
import type { Note } from "@/types";
import { cn } from "@/lib/utils";

type NoteListProps = {
  notes: Note[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  getMeta?: (note: Note) => string | null | undefined;
  onMetaClick?: (note: Note) => void;
  className?: string;
};

/** Apple Notes–style list: generous rows, hairline dividers, optional thumbnails. */
export function NoteList({
  notes,
  selectedId,
  onSelect,
  getMeta,
  onMetaClick,
  className,
}: NoteListProps) {
  if (notes.length === 0) return null;

  return (
    <ul className={cn("flex flex-col", className)}>
      {notes.map((note, index) => (
        <li key={note.id}>
          {index > 0 ? (
            <div
              className="ml-[1rem] border-t border-border-subtle md:ml-5"
              aria-hidden
            />
          ) : null}
          <NoteListItem
            note={note}
            selected={note.id === selectedId}
            onSelect={onSelect}
            meta={getMeta?.(note)}
            onMetaClick={
              onMetaClick ? () => onMetaClick(note) : undefined
            }
          />
        </li>
      ))}
    </ul>
  );
}
