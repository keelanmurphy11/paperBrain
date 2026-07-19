"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type FolderOverflowMenuProps = {
  canMutate: boolean;
  onRename: () => void;
  onDelete: () => void;
  className?: string;
};

export function FolderOverflowMenu({
  canMutate,
  onRename,
  onDelete,
  className,
}: FolderOverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
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

  if (!canMutate) return null;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        title="Folder actions"
        aria-label="Folder actions"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex size-9 items-center justify-center rounded-lg text-muted-subtle transition-colors duration-fast ease-out",
          "hover:bg-hover hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        )}
      >
        <MoreHorizontal className="size-4" strokeWidth={1.75} aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[10rem] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onRename();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors duration-fast ease-out hover:bg-hover focus-visible:bg-hover focus-visible:outline-none"
          >
            <Pencil className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
            Rename
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger transition-colors duration-fast ease-out hover:bg-danger-subtle focus-visible:bg-danger-subtle focus-visible:outline-none"
          >
            <Trash2 className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}
