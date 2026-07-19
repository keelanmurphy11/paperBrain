"use client";

import type { ReactNodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { ExternalLink, GripVertical, X } from "lucide-react";
import { useState } from "react";
import { getFaviconUrl, getUrlHostname } from "@/lib/url";
import { cn } from "@/lib/utils";

export function SourceBlockView({
  node,
  deleteNode,
  selected,
}: ReactNodeViewProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const url = String(node.attrs.url ?? "");
  const title = (node.attrs.title as string | null) ?? null;
  const hostname = getUrlHostname(url);
  const label = title?.trim() || hostname;

  return (
    <NodeViewWrapper
      className={cn("source-block", selected && "source-block--selected")}
    >
      <div
        className={cn(
          "group flex items-center gap-2 rounded-lg border border-border-subtle bg-background/60 px-2 py-2",
          "transition-colors duration-fast ease-out",
          selected && "border-accent/40 bg-active"
        )}
      >
        <button
          type="button"
          contentEditable={false}
          draggable={false}
          data-drag-handle
          aria-label="Drag source"
          className="flex shrink-0 cursor-grab items-center justify-center rounded-md p-0.5 text-muted-subtle hover:text-muted active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" strokeWidth={1.75} aria-hidden />
        </button>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          contentEditable={false}
          className="flex min-w-0 flex-1 items-center gap-2.5 focus-visible:outline-none"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-surface">
            {!imgFailed && url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getFaviconUrl(url)}
                alt=""
                width={16}
                height={16}
                className="size-4"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <span className="text-[9px] font-medium uppercase text-muted-subtle">
                {hostname.slice(0, 2) || "?"}
              </span>
            )}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-foreground">
              {label || "Source"}
            </span>
            {title?.trim() ? (
              <span className="block truncate text-xs text-muted-subtle">
                {hostname}
              </span>
            ) : null}
          </span>

          <ExternalLink
            className="size-3.5 shrink-0 text-muted-subtle opacity-0 transition-opacity duration-fast ease-out group-hover:opacity-100"
            strokeWidth={1.75}
            aria-hidden
          />
        </a>

        <button
          type="button"
          contentEditable={false}
          aria-label="Remove source"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteNode();
          }}
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-md text-muted-subtle opacity-0 transition-all duration-fast ease-out sm:size-8",
            "hover:bg-surface hover:text-foreground group-hover:opacity-100",
            "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          )}
        >
          <X className="size-3.5" strokeWidth={1.75} aria-hidden />
        </button>
      </div>
    </NodeViewWrapper>
  );
}
