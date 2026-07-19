"use client";

import { X } from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  useAddTagToNote,
  useDetachTagFromNote,
  useNoteTags,
  useTags,
} from "@/hooks/use-tags";
import type { Tag } from "@/types";
import { cn } from "@/lib/utils";

type NoteTagsProps = {
  noteId: string;
};

export function NoteTags({ noteId }: NoteTagsProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { data: noteTags = [] } = useNoteTags(noteId);
  const { data: allTags = [] } = useTags();
  const addTag = useAddTagToNote(noteId);
  const detachTag = useDetachTagFromNote(noteId);

  const attachedIds = useMemo(
    () => new Set(noteTags.map((t) => t.id)),
    [noteTags]
  );

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    return allTags
      .filter((t) => !attachedIds.has(t.id))
      .filter((t) => (q ? t.name.toLowerCase().includes(q) : true))
      .slice(0, 8);
  }, [allTags, attachedIds, value]);

  const exactMatch = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return null;
    return (
      allTags.find(
        (t) => !attachedIds.has(t.id) && t.name.toLowerCase() === q
      ) ?? null
    );
  }, [allTags, attachedIds, value]);

  const alreadyAttached = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return false;
    return noteTags.some((t) => t.name.toLowerCase() === q);
  }, [noteTags, value]);

  const showCreate =
    value.trim().length > 0 &&
    !exactMatch &&
    !alreadyAttached &&
    !suggestions.some((t) => t.name.toLowerCase() === value.trim().toLowerCase());

  const options: Array<{ kind: "tag"; tag: Tag } | { kind: "create"; name: string }> =
    [
      ...suggestions.map((tag) => ({ kind: "tag" as const, tag })),
      ...(showCreate
        ? [{ kind: "create" as const, name: value.trim() }]
        : []),
    ];

  useEffect(() => {
    setHighlight(0);
  }, [value, open]);

  async function commit(option?: (typeof options)[number]) {
    if (alreadyAttached) {
      setValue("");
      setOpen(false);
      return;
    }

    const chosen =
      option ??
      (options[highlight] ??
        (value.trim()
          ? ({ kind: "create", name: value.trim() } as const)
          : undefined));

    if (!chosen) return;

    setError(null);
    const name = chosen.kind === "tag" ? chosen.tag.name : chosen.name;

    try {
      await addTag.mutateAsync(name);
      setValue("");
      setOpen(false);
      inputRef.current?.focus();
    } catch {
      setError("Couldn’t add tag");
    }
  }

  async function handleRemove(tagId: string) {
    setError(null);
    try {
      await detachTag.mutateAsync(tagId);
    } catch {
      setError("Couldn’t remove tag");
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      if (!open && options.length > 0) {
        setOpen(true);
        return;
      }
      if (options.length === 0) return;
      event.preventDefault();
      setHighlight((h) => (h + 1) % options.length);
      return;
    }

    if (event.key === "ArrowUp") {
      if (options.length === 0) return;
      event.preventDefault();
      setHighlight((h) => (h - 1 + options.length) % options.length);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (!value.trim() && !options[highlight]) return;
      void commit(options[highlight]);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (event.key === "Backspace" && !value && noteTags.length > 0) {
      void handleRemove(noteTags[noteTags.length - 1].id);
    }
  }

  const busy = addTag.isPending || detachTag.isPending;

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {noteTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex max-w-full items-center gap-0.5 rounded-md bg-accent-subtle/70 py-0.5 pl-2 pr-0.5 text-xs text-accent"
          >
            <span className="truncate py-0.5">{tag.name}</span>
            <button
              type="button"
              onClick={() => void handleRemove(tag.id)}
              disabled={busy}
              aria-label={`Remove tag ${tag.name}`}
              className="flex size-7 shrink-0 items-center justify-center rounded-sm text-accent/70 transition-colors duration-fast ease-out hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-50"
            >
              <X className="size-3.5" strokeWidth={1.75} aria-hidden />
            </button>
          </span>
        ))}

        <div className="relative min-w-[7rem] flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setOpen(true);
              setError(null);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              // Delay so suggestion clicks register
              window.setTimeout(() => setOpen(false), 120);
            }}
            onKeyDown={handleKeyDown}
            disabled={busy}
            placeholder={noteTags.length === 0 ? "Add tag…" : "Tag…"}
            role="combobox"
            aria-expanded={open && options.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            className={cn(
              "w-full min-w-[5rem] bg-transparent px-1 py-0.5 text-xs text-foreground outline-none",
              "placeholder:text-muted-subtle/80 disabled:opacity-60"
            )}
          />

          {open && options.length > 0 ? (
            <ul
              id={listId}
              role="listbox"
              className="absolute left-0 top-full z-20 mt-1 max-h-48 w-56 overflow-y-auto rounded-md border border-border-subtle bg-surface py-1 shadow-sm"
            >
              {options.map((option, index) => {
                const selected = index === highlight;
                if (option.kind === "tag") {
                  return (
                    <li key={option.tag.id} role="option" aria-selected={selected}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => void commit(option)}
                        onMouseEnter={() => setHighlight(index)}
                        className={cn(
                          "flex w-full px-2.5 py-1.5 text-left text-xs text-foreground",
                          selected ? "bg-hover" : "hover:bg-hover"
                        )}
                      >
                        {option.tag.name}
                      </button>
                    </li>
                  );
                }

                return (
                  <li key={`create-${option.name}`} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => void commit(option)}
                      onMouseEnter={() => setHighlight(index)}
                      className={cn(
                        "flex w-full px-2.5 py-1.5 text-left text-xs text-muted",
                        selected ? "bg-hover" : "hover:bg-hover"
                      )}
                    >
                      Create “{option.name}”
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mt-1 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
