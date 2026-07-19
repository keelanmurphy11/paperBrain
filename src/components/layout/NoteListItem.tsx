"use client";

import { formatNoteDate } from "@/lib/format";
import { getNotePreview } from "@/lib/notes";
import type { Note } from "@/types";
import { cn } from "@/lib/utils";

type NoteListItemProps = {
  note: Note;
  selected?: boolean;
  onSelect: (id: string) => void;
};

export function NoteListItem({ note, selected, onSelect }: NoteListItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(note.id)}
      className={cn(
        "w-full rounded-lg px-3 py-3 text-left transition-colors duration-fast ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        selected ? "bg-active" : "hover:bg-hover"
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="truncate text-sm font-medium tracking-tight text-foreground">
          {note.title.trim() || "Untitled"}
        </h2>
        <time
          dateTime={note.updated_at}
          className="shrink-0 text-xs text-muted-subtle"
        >
          {formatNoteDate(note.updated_at)}
        </time>
      </div>
      <p className="mt-1 line-clamp-2 text-sm leading-snug text-muted">
        {getNotePreview(note.content_text)}
      </p>
    </button>
  );
}
