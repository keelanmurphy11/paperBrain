"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  NOTE_SORT_LABELS,
  type NoteSortMode,
} from "@/lib/notes";
import { cn } from "@/lib/utils";

type NoteSortControlProps = {
  value: NoteSortMode;
  onChange: (mode: NoteSortMode) => void;
  className?: string;
};

const OPTIONS: NoteSortMode[] = ["updated", "created", "title"];

export function NoteSortControl({
  value,
  onChange,
  className,
}: NoteSortControlProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

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

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-xs text-muted transition-colors duration-fast ease-out",
          "hover:bg-hover hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        )}
      >
        <span className="hidden sm:inline">{NOTE_SORT_LABELS[value]}</span>
        <span className="sm:hidden">Sort</span>
        <ChevronDown className="size-3.5 opacity-70" strokeWidth={1.75} aria-hidden />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Sort notes"
          className="absolute right-0 top-full z-20 mt-1 min-w-[10.5rem] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg"
        >
          {OPTIONS.map((option) => {
            const selected = option === value;
            return (
              <li key={option} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors duration-fast ease-out",
                    selected
                      ? "bg-accent-subtle text-accent"
                      : "text-foreground hover:bg-hover"
                  )}
                >
                  <span className="flex-1">{NOTE_SORT_LABELS[option]}</span>
                  {selected ? (
                    <Check className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
