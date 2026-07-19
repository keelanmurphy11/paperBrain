"use client";

import { formatNoteDate } from "@/lib/format";
import { getFirstNoteImageSrc, getNotePreview } from "@/lib/notes";
import { NOTE_DRAG_MIME } from "@/hooks/use-folders";
import type { Note } from "@/types";
import { cn } from "@/lib/utils";
import { useState, type DragEvent as ReactDragEvent } from "react";

type NoteListItemProps = {
  note: Note;
  selected?: boolean;
  onSelect: (id: string) => void;
  /** Optional secondary line under the date (e.g. folder path in All Notes). */
  meta?: string | null;
  onMetaClick?: () => void;
};

export function NoteListItem({
  note,
  selected,
  onSelect,
  meta,
  onMetaClick,
}: NoteListItemProps) {
  const thumbnail = getFirstNoteImageSrc(note.content);
  const [thumbFailed, setThumbFailed] = useState(false);
  const showThumb = Boolean(thumbnail) && !thumbFailed;
  const preview = getNotePreview(note.content_text, 140);
  const title = note.title.trim() || "Untitled";

  function handleDragStart(event: ReactDragEvent) {
    if (window.matchMedia("(pointer: coarse)").matches) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData(NOTE_DRAG_MIME, note.id);
    event.dataTransfer.effectAllowed = "move";
  }

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={handleDragStart}
      onClick={() => onSelect(note.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(note.id);
        }
      }}
      className={cn(
        "group flex w-full cursor-grab items-stretch gap-3 px-4 py-3.5 text-left transition-colors duration-fast ease-out active:cursor-grabbing md:px-5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/30",
        selected ? "bg-active" : "hover:bg-hover"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="truncate text-[15px] font-medium tracking-tight text-foreground">
            {title}
          </h2>
          <time
            dateTime={note.updated_at}
            className="shrink-0 text-[11px] tabular-nums text-muted-subtle"
          >
            {formatNoteDate(note.updated_at)}
          </time>
        </div>

        {meta ? (
          onMetaClick ? (
            <p className="mt-0.5 truncate text-[13px] text-muted">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMetaClick();
                }}
                className="truncate transition-colors duration-fast ease-out hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                {meta}
              </button>
            </p>
          ) : (
            <p className="mt-0.5 truncate text-[13px] text-muted">{meta}</p>
          )
        ) : null}

        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted">
          {preview}
        </p>
      </div>

      {showThumb ? (
        <div className="relative mt-0.5 size-14 shrink-0 overflow-hidden rounded-md bg-border-subtle">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnail!}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setThumbFailed(true)}
            className="size-full object-cover"
          />
        </div>
      ) : null}
    </div>
  );
}
