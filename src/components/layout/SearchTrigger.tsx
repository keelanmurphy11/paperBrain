"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type SearchTriggerProps = {
  className?: string;
  onClick?: () => void;
};

export function SearchTrigger({ className, onClick }: SearchTriggerProps) {
  const [shortcut, setShortcut] = useState("⌘K");

  useEffect(() => {
    const isApple = /Mac|iPhone|iPad|iPod/i.test(navigator.platform)
      || /Mac/i.test(navigator.userAgent);
    setShortcut(isApple ? "⌘K" : "Ctrl+K");
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full min-h-11 items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5 text-left text-sm text-muted transition-colors duration-fast ease-out",
        "hover:border-border hover:bg-hover",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        className
      )}
      aria-label="Search notes"
    >
      <Search
        className="size-3.5 shrink-0 text-muted-subtle"
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="flex-1 truncate">Search</span>
      <kbd className="hidden rounded border border-border-subtle bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-subtle sm:inline-block">
        {shortcut}
      </kbd>
    </button>
  );
}
