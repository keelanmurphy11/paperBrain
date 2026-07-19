"use client";

import { Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { SearchResultRow } from "@/components/search/SearchResultRow";
import { SearchResultsSkeleton } from "@/components/ui/Skeletons";
import { useAppNav } from "@/hooks/use-app-nav";
import { useFolders } from "@/hooks/use-folders";
import { useSearchNotes } from "@/hooks/use-search";
import { parseFolderIdFromPath } from "@/lib/navigation";
import { registerSearchFocus } from "@/lib/search-focus";
import type { SearchResult } from "@/lib/search-api";
import { cn } from "@/lib/utils";
import type { FolderId } from "@/types";

type SidebarSearchProps = {
  /** Folder nav rendered when the query is empty (Apple Notes in-sidebar swap). */
  children?: ReactNode;
  className?: string;
};

/**
 * Persistent search bar for the nav rail.
 * With a query, live results replace `children`; ⌘K focuses this input.
 */
export function SidebarSearch({ children, className }: SidebarSearchProps) {
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { openNote } = useAppNav();
  const { data: folders = [] } = useFolders();

  const [query, setQuery] = useState("");
  const [scopeFolderId, setScopeFolderId] = useState<FolderId | null>(null);
  const [scopeInitialized, setScopeInitialized] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [shortcut, setShortcut] = useState("⌘K");

  const routeFolderId = parseFolderIdFromPath(pathname);

  const {
    data: results = [],
    isFetching,
    isError,
    debouncedQuery,
    isDebouncing,
  } = useSearchNotes(query, true, scopeFolderId);

  const hasQuery = query.trim().length > 0;
  const showResults = hasQuery && results.length > 0 && !isError;
  const isSearching =
    hasQuery &&
    !isError &&
    results.length === 0 &&
    (isDebouncing || isFetching);

  const scopeFolder = scopeFolderId
    ? folders.find((f) => f.id === scopeFolderId) ?? null
    : null;

  useEffect(() => {
    const isApple =
      /Mac|iPhone|iPad|iPod/i.test(navigator.platform) ||
      /Mac/i.test(navigator.userAgent);
    setShortcut(isApple ? "⌘K" : "Ctrl+K");
  }, []);

  const applyScopeFromContext = useCallback(
    (explicit?: FolderId | null) => {
      if (explicit !== undefined) {
        setScopeFolderId(explicit);
        setScopeInitialized(true);
        return;
      }
      setScopeFolderId(routeFolderId);
      setScopeInitialized(true);
    },
    [routeFolderId]
  );

  const focusSearch = useCallback(
    (options?: { scopeFolderId?: string | null }) => {
      const el = inputRef.current;
      if (!el) return;
      // Skip hidden instances (desktop/mobile duplicate mounts)
      if (el.getClientRects().length === 0) return;

      if (options && "scopeFolderId" in options) {
        applyScopeFromContext(options.scopeFolderId ?? null);
      } else if (!scopeInitialized) {
        applyScopeFromContext();
      }
      el.focus();
      el.select();
    },
    [applyScopeFromContext, scopeInitialized]
  );

  useEffect(() => {
    return registerSearchFocus(focusSearch);
  }, [focusSearch]);

  // Allow re-scoping when the route folder changes and the field is idle
  useEffect(() => {
    if (!hasQuery) {
      setScopeInitialized(false);
      setScopeFolderId(null);
    }
  }, [routeFolderId, hasQuery]);

  useEffect(() => {
    setHighlight(0);
  }, [debouncedQuery, results, scopeFolderId]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-search-index="${highlight}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight, results]);

  // Escape when results are active but the field lost focus
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (document.activeElement === inputRef.current) return;
      if (!query.trim()) return;
      event.preventDefault();
      setQuery("");
      setHighlight(0);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [query]);

  function clearSearch() {
    setQuery("");
    setHighlight(0);
    inputRef.current?.focus();
  }

  function handleFocus() {
    if (!scopeInitialized) {
      applyScopeFromContext();
    }
  }

  function handleSelect(result: SearchResult) {
    openNote(result.note_id);
    setQuery("");
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      if (query) {
        clearSearch();
        return;
      }
      // Exit search: blur and return attention to the page
      inputRef.current?.blur();
      return;
    }

    if (!showResults) return;

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
      if (result) handleSelect(result);
    }
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="shrink-0 px-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-subtle"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder="Search"
            autoComplete="off"
            spellCheck={false}
            aria-label="Search notes"
            aria-autocomplete="list"
            aria-controls="sidebar-search-results"
            className={cn(
              "w-full min-h-9 rounded-md bg-hover/80 py-2 pl-8 pr-16 text-sm text-foreground outline-none transition-colors duration-fast ease-out",
              "placeholder:text-muted-subtle",
              "hover:bg-hover focus:bg-hover focus:ring-2 focus:ring-accent/30"
            )}
          />
          <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
            {query ? (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="flex size-6 items-center justify-center rounded text-muted-subtle transition-colors duration-fast ease-out hover:bg-background hover:text-foreground"
              >
                <X className="size-3.5" strokeWidth={1.75} aria-hidden />
              </button>
            ) : (
              <kbd className="hidden rounded px-1 font-mono text-[10px] text-muted-subtle/80 sm:inline-block">
                {shortcut}
              </kbd>
            )}
          </div>
        </div>

        {scopeFolder ? (
          <div className="mt-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setScopeFolderId(null)}
              className={cn(
                "inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-full bg-accent-subtle px-2.5 py-1 text-[11px] text-accent transition-colors duration-fast ease-out",
                "hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              )}
              title="Search all notes"
            >
              <span className="truncate">Searching in {scopeFolder.name}</span>
              <X
                className="size-3 shrink-0 opacity-70"
                strokeWidth={2}
                aria-hidden
              />
            </button>
          </div>
        ) : scopeInitialized && routeFolderId ? (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setScopeFolderId(routeFolderId)}
              className="text-[11px] text-muted-subtle transition-colors duration-fast ease-out hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              Search this folder only
            </button>
          </div>
        ) : null}
      </div>

      {hasQuery ? (
        <div
          id="sidebar-search-results"
          ref={listRef}
          role="listbox"
          aria-label="Search results"
          className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {isSearching ? (
            <SearchResultsSkeleton />
          ) : isError ? (
            <p className="px-4 py-8 text-center text-sm text-danger">
              Couldn’t search right now.
            </p>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted">
                Nothing matched “{debouncedQuery}”
              </p>
              {scopeFolder ? (
                <p className="mt-1 text-xs text-muted-subtle">
                  in {scopeFolder.name}
                </p>
              ) : null}
            </div>
          ) : (
            <ul>
              {results.map((result, index) => (
                <li key={result.note_id}>
                  {index > 0 ? (
                    <div
                      className="ml-3 border-t border-border-subtle"
                      aria-hidden
                    />
                  ) : null}
                  <SearchResultRow
                    result={result}
                    index={index}
                    selected={index === highlight}
                    showFolderLabel={!scopeFolderId}
                    onSelect={() => handleSelect(result)}
                    onHover={() => setHighlight(index)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      )}
    </div>
  );
}

type MobileSearchOverlayProps = {
  open: boolean;
  onClose: () => void;
  initialScopeFolderId?: FolderId | null;
};

/**
 * Full-screen search for mobile when the sidebar isn’t on screen
 * (e.g. opened via ⌘K from Folder View / Note).
 */
export function MobileSearchOverlay({
  open,
  onClose,
  initialScopeFolderId = null,
}: MobileSearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { openNote } = useAppNav();
  const { data: folders = [] } = useFolders();

  const [query, setQuery] = useState("");
  const [scopeFolderId, setScopeFolderId] = useState<FolderId | null>(
    initialScopeFolderId
  );
  const [highlight, setHighlight] = useState(0);

  const { data: results = [], isFetching, isError, debouncedQuery, isDebouncing } =
    useSearchNotes(query, open, scopeFolderId);

  const hasQuery = query.trim().length > 0;
  const showResults = hasQuery && results.length > 0 && !isError;
  const isSearching =
    hasQuery &&
    !isError &&
    results.length === 0 &&
    (isDebouncing || isFetching);

  const scopeFolder = scopeFolderId
    ? folders.find((f) => f.id === scopeFolderId) ?? null
    : null;

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setScopeFolderId(initialScopeFolderId);
    setHighlight(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [open, initialScopeFolderId]);

  useEffect(() => {
    setHighlight(0);
  }, [debouncedQuery, results, scopeFolderId]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      // Input handler owns Escape while focused (clear → close)
      if (document.activeElement === inputRef.current) return;
      event.preventDefault();
      if (query.trim()) {
        setQuery("");
        inputRef.current?.focus();
        return;
      }
      onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, query]);

  if (!open) return null;

  function handleSelect(result: SearchResult) {
    openNote(result.note_id);
    onClose();
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      if (query.trim()) {
        setQuery("");
        return;
      }
      onClose();
      return;
    }

    if (!showResults) return;

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
      if (result) handleSelect(result);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden">
      <div className="flex items-center gap-2 border-b border-border-subtle px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-subtle"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search"
            autoComplete="off"
            spellCheck={false}
            className="w-full min-h-10 rounded-lg bg-hover py-2 pl-8 pr-3 text-sm text-foreground outline-none placeholder:text-muted-subtle focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 px-2 text-sm text-accent transition-colors duration-fast ease-out hover:text-accent-hover"
        >
          Cancel
        </button>
      </div>

      {scopeFolder ? (
        <div className="px-3 pt-2">
          <button
            type="button"
            onClick={() => setScopeFolderId(null)}
            className="inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-full bg-accent-subtle px-2.5 py-1 text-[11px] text-accent"
          >
            <span className="truncate">Searching in {scopeFolder.name}</span>
            <X className="size-3 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
          </button>
        </div>
      ) : initialScopeFolderId ? (
        <div className="px-3 pt-2">
          <button
            type="button"
            onClick={() => setScopeFolderId(initialScopeFolderId)}
            className="text-[11px] text-muted-subtle transition-colors duration-fast ease-out hover:text-accent"
          >
            Search this folder only
          </button>
        </div>
      ) : null}

      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        {!hasQuery ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-muted-subtle">
              Search notes, tags, and sources
            </p>
          </div>
        ) : isSearching ? (
          <SearchResultsSkeleton />
        ) : isError ? (
          <p className="px-4 py-10 text-center text-sm text-danger">
            Couldn’t search right now.
          </p>
        ) : results.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-muted">
              Nothing matched “{debouncedQuery}”
            </p>
          </div>
        ) : (
          <ul>
            {results.map((result, index) => (
              <li key={result.note_id}>
                {index > 0 ? (
                  <div
                    className="ml-3 border-t border-border-subtle"
                    aria-hidden
                  />
                ) : null}
                <SearchResultRow
                  result={result}
                  index={index}
                  selected={index === highlight}
                  showFolderLabel={!scopeFolderId}
                  onSelect={() => handleSelect(result)}
                  onHover={() => setHighlight(index)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
