"use client";

import { useBacklinks } from "@/hooks/use-links";
import { getNotePreview } from "@/lib/notes";
import { noteDisplayTitle } from "@/lib/fuzzy";
import { useUiStore } from "@/store/ui";
import { cn } from "@/lib/utils";

type BacklinksSectionProps = {
  noteId: string;
  className?: string;
};

export function BacklinksSection({ noteId, className }: BacklinksSectionProps) {
  const { data: backlinks = [], isLoading } = useBacklinks(noteId);
  const selectNote = useUiStore((s) => s.selectNote);

  if (isLoading) {
    return (
      <section className={cn("mt-12 border-t border-border-subtle pt-6", className)}>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-subtle">
          Linked mentions
        </p>
        <p className="mt-3 text-xs text-muted-subtle">Loading…</p>
      </section>
    );
  }

  if (backlinks.length === 0) {
    return (
      <section className={cn("mt-12 border-t border-border-subtle pt-6", className)}>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-subtle">
          Linked mentions
        </p>
        <p className="mt-3 text-xs text-muted-subtle">
          No other notes link here yet.
        </p>
      </section>
    );
  }

  return (
    <section className={cn("mt-12 border-t border-border-subtle pt-6", className)}>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-subtle">
        Linked mentions
      </p>
      <ul className="mt-3 flex flex-col gap-1">
        {backlinks.map(({ note }) => (
          <li key={note.id}>
            <button
              type="button"
              onClick={() => selectNote(note.id)}
              className="w-full rounded-md px-2 py-2 text-left transition-colors duration-fast ease-out hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              <span className="block text-sm text-foreground">
                {noteDisplayTitle(note.title)}
              </span>
              <span className="mt-0.5 block text-xs text-muted-subtle line-clamp-2">
                {getNotePreview(note.content_text, 140)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
