"use client";

import { useMemo } from "react";
import { formatNoteDate } from "@/lib/format";
import { useAppNav } from "@/hooks/use-app-nav";
import type { SearchResult } from "@/lib/search-api";
import { noteDisplayTitle } from "@/lib/fuzzy";
import { cn } from "@/lib/utils";

type SearchResultRowProps = {
  result: SearchResult;
  selected?: boolean;
  index: number;
  onSelect: () => void;
  onHover?: () => void;
  /** When searching a single folder, hide the folder label. */
  showFolderLabel?: boolean;
};

/** Folder View–styled search hit: title, highlighted snippet, date, match why. */
export function SearchResultRow({
  result,
  selected,
  index,
  onSelect,
  onHover,
  showFolderLabel = true,
}: SearchResultRowProps) {
  const { openFolder } = useAppNav();
  const matchWhy = useMemo(() => describeMatch(result), [result]);
  const title = noteDisplayTitle(result.title);
  const folderLabel = result.folder_path ?? result.folder_name;

  return (
    <div
      id={`search-result-${result.note_id}`}
      data-search-index={index}
      role="option"
      aria-selected={selected}
      tabIndex={-1}
      onClick={onSelect}
      onMouseEnter={onHover}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "flex w-full cursor-pointer items-stretch gap-3 px-3 py-3.5 text-left transition-colors duration-fast ease-out",
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
            dateTime={result.updated_at}
            className="shrink-0 text-[11px] tabular-nums text-muted-subtle"
          >
            {formatNoteDate(result.updated_at)}
          </time>
        </div>

        {showFolderLabel && folderLabel && result.folder_id ? (
          <p className="mt-0.5 flex min-w-0 items-center gap-1 text-[13px] text-muted">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openFolder(result.folder_id!);
              }}
              className="truncate transition-colors duration-fast ease-out hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              title={`Open ${folderLabel}`}
            >
              {folderLabel}
            </button>
          </p>
        ) : showFolderLabel && folderLabel ? (
          <p className="mt-0.5 truncate text-[13px] text-muted">{folderLabel}</p>
        ) : null}

        {result.snippet ? (
          <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted">
            <HighlightedSnippet text={result.snippet} />
          </p>
        ) : null}

        {matchWhy ? (
          <p className="mt-1.5 truncate text-[11px] text-accent">{matchWhy}</p>
        ) : null}
      </div>
    </div>
  );
}

function describeMatch(result: SearchResult): string | null {
  const via = new Set(result.matched_via);
  const tag = result.tags.find((t) => t.matched);
  if (tag || via.has("tag")) {
    return `matched tag: ${tag?.name ?? "tag"}`;
  }
  const source = result.sources.find((s) => s.matched);
  if (source || via.has("source")) {
    const label = source?.title?.trim() || source?.url || "source";
    return `matched source: ${label}`;
  }
  return null;
}

/** Renders ts_headline output with &lt;mark&gt; highlights as React nodes. */
export function HighlightedSnippet({ text }: { text: string }) {
  const parts = useMemo(() => parseHighlightedSnippet(text), [text]);

  return (
    <>
      {parts.map((part, i) =>
        part.mark ? (
          <mark
            key={i}
            className="rounded-sm bg-accent-subtle px-0.5 font-medium text-foreground"
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
