"use client";

import { ExternalLink, FileText, Search } from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useSearchNotes } from "@/hooks/use-search";
import type { SearchResult } from "@/lib/search-api";
import { noteDisplayTitle } from "@/lib/fuzzy";
import { cn } from "@/lib/utils";

type SearchPaletteProps = {
  open: boolean;
  onClose: () => void;
  onSelectNote: (noteId: string) => void;
};

export function SearchPalette({
  open,
  onClose,
  onSelectNote,
}: SearchPaletteProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const { data: results = [], isFetching, isError, debouncedQuery, isDebouncing } =
    useSearchNotes(query, open);

  const hasQuery = query.trim().length > 0;
  const showResultList = hasQuery && results.length > 0 && !isError;
  const isSearching =
    hasQuery &&
    !isError &&
    results.length === 0 &&
    (isDebouncing || isFetching);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setHighlight(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [debouncedQuery, results]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-search-index="${highlight}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight, open, results]);

  function openResult(result: SearchResult) {
    onSelectNote(result.note_id);
    onClose();
  }

  function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (!showResultList) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((h) => (h + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((h) => (h - 1 + results.length) % results.length);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const result = results[highlight];
      if (result) openResult(result);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/25 px-4 pb-8 pt-[12vh] sm:pt-[14vh]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex w-full max-w-xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
      >
        <h2 id={titleId} className="sr-only">
          Search notes
        </h2>

        <div className="flex items-center gap-2.5 border-b border-border-subtle px-3.5 py-3">
          <Search
            className="size-4 shrink-0 text-muted-subtle"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search notes, tags, sources…"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-subtle"
            aria-autocomplete="list"
            aria-controls="search-results"
            aria-activedescendant={
              showResultList && results[highlight]
                ? `search-result-${results[highlight].note_id}`
                : undefined
            }
          />
          <kbd className="hidden shrink-0 rounded border border-border-subtle bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-subtle sm:inline-block">
            esc
          </kbd>
        </div>

        <div
          id="search-results"
          ref={listRef}
          role="listbox"
          aria-label="Search results"
          className="max-h-[min(28rem,55vh)] overflow-y-auto overscroll-contain"
        >
          {!hasQuery ? (
            <EmptyState />
          ) : isSearching ? (
            <p className="px-4 py-10 text-center text-sm text-muted-subtle">
              Searching…
            </p>
          ) : isError ? (
            <p className="px-4 py-10 text-center text-sm text-danger">
              Couldn’t search right now. Try again in a moment.
            </p>
          ) : results.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-subtle">
              Nothing matched “{debouncedQuery}”
            </p>
          ) : (
            <div className="py-1.5">
              <p className="px-3.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-subtle">
                Notes
              </p>
              <ul>
                {results.map((result, index) => (
                  <li key={result.note_id}>
                    <SearchResultRow
                      result={result}
                      index={index}
                      selected={index === highlight}
                      onSelect={() => openResult(result)}
                      onHover={() => setHighlight(index)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-sm text-muted-subtle">
        Search titles, content, tags, and sources
      </p>
      <p className="mt-1.5 text-xs text-muted-subtle/80">
        Tip: try a tag name or a source title
      </p>
    </div>
  );
}

function SearchResultRow({
  result,
  index,
  selected,
  onSelect,
  onHover,
}: {
  result: SearchResult;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const matchedSources = useMemo(
    () => result.sources.filter((s) => s.matched),
    [result.sources]
  );
  const displaySources =
    matchedSources.length > 0 ? matchedSources : result.sources.slice(0, 2);
  const matchedTags = useMemo(
    () => result.tags.filter((t) => t.matched),
    [result.tags]
  );

  return (
    <button
      type="button"
      id={`search-result-${result.note_id}`}
      data-search-index={index}
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        "flex w-full min-h-[2.75rem] gap-2.5 px-3.5 py-2.5 text-left transition-colors duration-fast ease-out",
        selected ? "bg-active" : "hover:bg-hover"
      )}
    >
      <FileText
        className="mt-0.5 size-3.5 shrink-0 text-muted-subtle"
        strokeWidth={1.75}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {noteDisplayTitle(result.title)}
          </span>
          {matchedTags.length > 0 ? (
            <span className="shrink-0 text-[11px] text-accent">
              {matchedTags.map((t) => t.name).join(", ")}
            </span>
          ) : null}
        </div>

        {result.snippet ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted">
            <HighlightedSnippet text={result.snippet} />
          </p>
        ) : null}

        {displaySources.length > 0 ? (
          <ul className="mt-1.5 flex flex-col gap-0.5">
            {displaySources.map((source) => (
              <li key={source.id}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "inline-flex max-w-full items-center gap-1 truncate text-[11px] transition-colors duration-fast ease-out",
                    source.matched
                      ? "text-accent hover:text-accent-hover"
                      : "text-muted-subtle hover:text-muted"
                  )}
                >
                  <ExternalLink
                    className="size-2.5 shrink-0"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <span className="truncate">
                    {source.title?.trim() || source.url}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </button>
  );
}

/** Renders ts_headline output with <mark> highlights as React nodes. */
function HighlightedSnippet({ text }: { text: string }) {
  const parts = useMemo(() => parseHighlightedSnippet(text), [text]);

  return (
    <>
      {parts.map((part, i) =>
        part.mark ? (
          <mark
            key={i}
            className="rounded-sm bg-accent-subtle px-0.5 text-foreground"
          >
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
}

function parseHighlightedSnippet(
  text: string
): Array<{ text: string; mark: boolean }> {
  const parts: Array<{ text: string; mark: boolean }> = [];
  const re = /<mark>(.*?)<\/mark>/gi;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({
        text: decodeSnippetEntities(text.slice(last, match.index)),
        mark: false,
      });
    }
    parts.push({ text: decodeSnippetEntities(match[1] ?? ""), mark: true });
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push({ text: decodeSnippetEntities(text.slice(last)), mark: false });
  }

  if (parts.length === 0) {
    parts.push({ text: decodeSnippetEntities(text), mark: false });
  }

  return parts;
}

function decodeSnippetEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
