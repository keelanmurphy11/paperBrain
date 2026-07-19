"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTags } from "@/hooks/use-tags";
import type { Tag } from "@/types";
import { cn } from "@/lib/utils";

type TagsSectionProps = {
  selectedTagId: string | null;
  onSelectTag: (tagId: string | null) => void;
};

export function TagsSection({
  selectedTagId,
  onSelectTag,
}: TagsSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const { data: tags = [], isLoading } = useTags();

  return (
    <div className="border-b border-border-subtle pb-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full min-h-11 items-center gap-1 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-subtle transition-colors duration-fast ease-out hover:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-inset"
      >
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 transition-transform duration-fast ease-out",
            expanded ? "rotate-0" : "-rotate-90"
          )}
          strokeWidth={1.75}
          aria-hidden
        />
        Tags
        {selectedTagId ? (
          <span className="ml-auto normal-case tracking-normal text-accent">
            filtered
          </span>
        ) : null}
      </button>

      {expanded ? (
        <div className="px-2 pb-1">
          {isLoading ? (
            <p className="px-3 py-2 text-xs text-muted">Loading…</p>
          ) : tags.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-subtle">No tags yet</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {tags.map((tag) => (
                <TagFilterItem
                  key={tag.id}
                  tag={tag}
                  selected={tag.id === selectedTagId}
                  onSelect={() =>
                    onSelectTag(tag.id === selectedTagId ? null : tag.id)
                  }
                />
              ))}
            </ul>
          )}

          {selectedTagId ? (
            <button
              type="button"
              onClick={() => onSelectTag(null)}
              className="mt-1 flex w-full min-h-11 items-center rounded-md px-3 text-left text-xs text-muted transition-colors duration-fast ease-out hover:bg-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              Clear filter
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function TagFilterItem({
  tag,
  selected,
  onSelect,
}: {
  tag: Tag;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          "flex w-full min-h-11 items-center rounded-md px-3 text-left text-xs transition-colors duration-fast ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          selected
            ? "bg-accent-subtle text-accent"
            : "text-muted hover:bg-hover hover:text-foreground"
        )}
      >
        <span className="truncate">{tag.name}</span>
      </button>
    </li>
  );
}
