"use client";

import { Check, ChevronDown, Folder as FolderIcon, Search } from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  buildFolderPickerOptions,
  getFolderPath,
  useFolders,
  useMoveNoteToFolder,
} from "@/hooks/use-folders";
import { toast } from "@/store/toast";
import type { FolderId } from "@/types";
import { cn } from "@/lib/utils";

type NoteFolderBreadcrumbProps = {
  noteId: string;
  folderId: FolderId | null;
  className?: string;
};

export function NoteFolderBreadcrumb({
  noteId,
  folderId,
  className,
}: NoteFolderBreadcrumbProps) {
  const { data: folders = [] } = useFolders();
  const moveNote = useMoveNoteToFolder();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const label = getFolderPath(folders, folderId);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
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

  async function handleSelect(nextFolderId: FolderId) {
    if (nextFolderId === folderId) {
      setOpen(false);
      return;
    }
    try {
      await moveNote.mutateAsync({ noteId, folderId: nextFolderId });
      setOpen(false);
    } catch (err) {
      console.error("Failed to move note", err);
      toast(
        err instanceof Error ? err.message : "Couldn’t move note",
        "error"
      );
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        title="Move to folder"
        className={cn(
          "inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted transition-colors duration-fast ease-out",
          "hover:bg-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          open && "bg-hover text-foreground"
        )}
      >
        <FolderIcon className="size-3 shrink-0" strokeWidth={1.75} aria-hidden />
        <span className="truncate">{label}</span>
        <ChevronDown
          className={cn(
            "size-3 shrink-0 text-muted-subtle transition-transform duration-fast ease-out",
            open && "rotate-180"
          )}
          strokeWidth={1.75}
          aria-hidden
        />
      </button>

      {open ? (
        <FolderPickerDropdown
          selectedFolderId={folderId}
          busy={moveNote.isPending}
          onSelect={(id) => void handleSelect(id)}
        />
      ) : null}
    </div>
  );
}

type FolderPickerDropdownProps = {
  selectedFolderId: FolderId | null;
  busy?: boolean;
  onSelect: (folderId: FolderId) => void;
  /** Optional controlled filter used by search palette */
  className?: string;
};

export function FolderPickerDropdown({
  selectedFolderId,
  busy,
  onSelect,
  className,
}: FolderPickerDropdownProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: folders = [] } = useFolders();
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const options = useMemo(
    () => buildFolderPickerOptions(folders),
    [folders]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.path.toLowerCase().includes(q) || o.name.toLowerCase().includes(q)
    );
  }, [options, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (filtered.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((h) => (h + 1) % filtered.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((h) => (h - 1 + filtered.length) % filtered.length);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[highlight];
      if (option && !busy) onSelect(option.id);
    }
  }

  return (
    <div
      className={cn(
        "absolute left-0 top-full z-40 mt-1 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-surface shadow-lg",
        className
      )}
      role="listbox"
      id={listId}
      aria-label="Folders"
    >
      <div className="flex items-center gap-2 border-b border-border-subtle px-2.5 py-2">
        <Search
          className="size-3.5 shrink-0 text-muted-subtle"
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Filter folders…"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-subtle"
        />
      </div>

      <ul className="max-h-56 overflow-y-auto overscroll-contain py-1">
        {filtered.length === 0 ? (
          <li className="px-3 py-4 text-center text-xs text-muted-subtle">
            No folders match
          </li>
        ) : (
          filtered.map((option, index) => {
            const selected = option.id === selectedFolderId;
            const active = index === highlight;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={busy}
                  onClick={() => onSelect(option.id)}
                  onMouseEnter={() => setHighlight(index)}
                  className={cn(
                    "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm transition-colors duration-fast ease-out",
                    active ? "bg-hover" : "hover:bg-hover",
                    selected && "text-accent"
                  )}
                  style={{ paddingLeft: 10 + option.depth * 12 }}
                >
                  <FolderIcon
                    className="size-3.5 shrink-0 text-muted-subtle"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate">{option.path}</span>
                  {selected ? (
                    <Check
                      className="size-3.5 shrink-0 text-accent"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  ) : null}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
