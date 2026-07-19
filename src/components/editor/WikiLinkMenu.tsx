"use client";

import type { Editor } from "@tiptap/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { useCreateNote, useNotes } from "@/hooks/use-notes";
import { fuzzyMatchNotes, noteDisplayTitle } from "@/lib/fuzzy";
import { cn } from "@/lib/utils";

type WikiLinkMenuProps = {
  editor: Editor;
  currentNoteId: string;
};

type MatchRange = {
  from: number;
  to: number;
  query: string;
};

type MenuOption =
  | { kind: "note"; id: string; title: string }
  | { kind: "create"; title: string };

function findWikiLinkMatch(editor: Editor): MatchRange | null {
  const { state } = editor;
  const { from, empty } = state.selection;
  if (!empty) return null;

  const $from = state.selection.$from;
  const textBefore = $from.parent.textBetween(
    Math.max(0, $from.parentOffset - 80),
    $from.parentOffset,
    undefined,
    "\ufffc"
  );

  const match = textBefore.match(/\[\[([^\n\[\]]*)$/);
  if (!match) return null;

  const full = match[0];
  const query = match[1] ?? "";
  return {
    from: from - full.length,
    to: from,
    query,
  };
}

export function WikiLinkMenu({ editor, currentNoteId }: WikiLinkMenuProps) {
  const { data: notes = [] } = useNotes();
  const createNote = useCreateNote();

  const [match, setMatch] = useState<MatchRange | null>(null);
  const [highlight, setHighlight] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    const next = findWikiLinkMatch(editor);
    setMatch(next);
    if (!next) {
      setCoords(null);
      return;
    }

    try {
      const start = editor.view.coordsAtPos(next.from);
      const root =
        editor.view.dom.closest("[data-wiki-link-root]") ??
        editor.view.dom.parentElement;
      if (!root) {
        setCoords(null);
        return;
      }
      const base = root.getBoundingClientRect();
      setCoords({
        top: start.bottom - base.top + 6,
        left: Math.max(0, start.left - base.left),
      });
    } catch {
      setCoords(null);
    }
  }, [editor]);

  useEffect(() => {
    refresh();
    editor.on("update", refresh);
    editor.on("selectionUpdate", refresh);
    return () => {
      editor.off("update", refresh);
      editor.off("selectionUpdate", refresh);
    };
  }, [editor, refresh]);

  useLayoutEffect(() => {
    if (!match) return;
    refresh();
  }, [match?.query, match?.from, match?.to, refresh, match]);

  const matches = useMemo(() => {
    if (!match) return [];
    return fuzzyMatchNotes(notes, match.query, {
      excludeId: currentNoteId,
      limit: 8,
    });
  }, [notes, match, currentNoteId]);

  const exactTitle = match?.query.trim() ?? "";
  const hasExact = matches.some(
    (n) =>
      noteDisplayTitle(n.title).toLowerCase() === exactTitle.toLowerCase() &&
      exactTitle.length > 0
  );

  const showCreate = exactTitle.length > 0 && !hasExact;

  const options: MenuOption[] = useMemo(() => {
    const list: MenuOption[] = matches.map((n) => ({
      kind: "note",
      id: n.id,
      title: noteDisplayTitle(n.title),
    }));
    if (showCreate) {
      list.push({ kind: "create", title: exactTitle });
    }
    return list;
  }, [matches, showCreate, exactTitle]);

  useEffect(() => {
    setHighlight(0);
  }, [match?.query, options.length]);

  const insertLink = useCallback(
    async (option: MenuOption) => {
      if (!match || busy) return;
      setBusy(true);
      try {
        let noteId: string;
        let title: string;

        if (option.kind === "create") {
          const note = await createNote.mutateAsync({ title: option.title });
          noteId = note.id;
          title = noteDisplayTitle(note.title);
        } else {
          noteId = option.id;
          title = option.title;
        }

        editor
          .chain()
          .focus()
          .insertNoteLink({
            noteId,
            title,
            from: match.from,
            to: match.to,
          })
          .run();

        setMatch(null);
      } catch (err) {
        console.error("Failed to insert note link", err);
      } finally {
        setBusy(false);
      }
    },
    [match, busy, createNote, editor]
  );

  useEffect(() => {
    if (!match || options.length === 0) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        event.stopPropagation();
        setHighlight((h) => (h + 1) % options.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        event.stopPropagation();
        setHighlight((h) => (h - 1 + options.length) % options.length);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        event.stopPropagation();
        const option = options[highlight];
        if (option) void insertLink(option);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setMatch(null);
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [match, options, highlight, insertLink]);

  if (!match || !coords || options.length === 0) return null;

  return (
    <div
      className="absolute z-30 w-64 overflow-hidden rounded-md border border-border-subtle bg-surface shadow-sm"
      style={{ top: coords.top, left: coords.left }}
      role="listbox"
      aria-label="Link to note"
    >
      <ul className="max-h-56 overflow-y-auto py-1">
        {options.map((option, index) => {
          const selected = index === highlight;
          const label =
            option.kind === "create"
              ? `Create “${option.title}”`
              : option.title;

          return (
            <li
              key={
                option.kind === "create" ? `create-${option.title}` : option.id
              }
            >
              <button
                type="button"
                role="option"
                aria-selected={selected}
                disabled={busy}
                onMouseDown={(e) => {
                  e.preventDefault();
                  void insertLink(option);
                }}
                onMouseEnter={() => setHighlight(index)}
                className={cn(
                  "flex w-full px-2.5 py-1.5 text-left text-xs transition-colors duration-fast ease-out",
                  option.kind === "create" ? "text-muted" : "text-foreground",
                  selected ? "bg-hover" : "hover:bg-hover",
                  "disabled:opacity-60"
                )}
              >
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
