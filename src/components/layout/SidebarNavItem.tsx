"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type DragEvent as ReactDragEvent, type ReactNode } from "react";
import { NOTE_DRAG_MIME } from "@/hooks/use-folders";
import { useUiStore } from "@/store/ui";
import { cn } from "@/lib/utils";

type SidebarNavItemProps = {
  href: string;
  label: string;
  count?: number;
  active?: boolean;
  /** Indent for nested folders (0 = root). */
  depth?: number;
  onNavigate?: () => void;
  /** Enable dropping notes onto this row. */
  dropFolderId?: string | null;
  onDropNote?: (folderId: string, noteId: string) => void;
  isDropTarget?: boolean;
  onDropTargetChange?: (folderId: string | null) => void;
  trailing?: ReactNode;
  leading?: ReactNode;
  onContextMenu?: (event: React.MouseEvent) => void;
  className?: string;
};

/**
 * Quiet Apple Notes–style sidebar row: name + count, real route link, optional DnD.
 */
export function SidebarNavItem({
  href,
  label,
  count,
  active,
  depth = 0,
  onNavigate,
  dropFolderId,
  onDropNote,
  isDropTarget,
  onDropTargetChange,
  trailing,
  leading,
  onContextMenu,
  className,
}: SidebarNavItemProps) {
  const pathname = usePathname();
  const dropEnabled = Boolean(dropFolderId && onDropNote);

  function handleClick() {
    // Keep in-app back stack aligned with Next.js Link navigations
    if (href !== pathname) {
      useUiStore.getState().pushInAppHistory();
    }
    onNavigate?.();
  }

  function handleDragOver(event: ReactDragEvent) {
    if (!dropEnabled || !dropFolderId) return;
    if (![...event.dataTransfer.types].includes(NOTE_DRAG_MIME)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    onDropTargetChange?.(dropFolderId);
  }

  function handleDragLeave(event: ReactDragEvent) {
    if (!dropEnabled || !dropFolderId) return;
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    onDropTargetChange?.(null);
  }

  function handleDrop(event: ReactDragEvent) {
    if (!dropEnabled || !dropFolderId || !onDropNote) return;
    event.preventDefault();
    const noteId = event.dataTransfer.getData(NOTE_DRAG_MIME);
    if (noteId) onDropNote(dropFolderId, noteId);
    else onDropTargetChange?.(null);
  }

  return (
    <div
      className={cn(
        "group relative flex min-h-9 items-center rounded-md transition-colors duration-fast ease-out",
        isDropTarget
          ? "bg-accent-subtle ring-1 ring-inset ring-accent/40"
          : active
            ? "bg-accent-subtle"
            : "hover:bg-hover",
        className
      )}
      style={{ paddingLeft: 8 + depth * 12 }}
      onContextMenu={onContextMenu}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {leading}
      <Link
        href={href}
        onClick={handleClick}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-1 text-left text-sm transition-colors duration-fast ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/30",
          active ? "font-medium text-accent" : "text-foreground",
          !leading && "pl-2"
        )}
      >
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {typeof count === "number" ? (
          <span className="shrink-0 tabular-nums text-[11px] text-muted-subtle">
            {count}
          </span>
        ) : null}
      </Link>
      {trailing}
    </div>
  );
}
