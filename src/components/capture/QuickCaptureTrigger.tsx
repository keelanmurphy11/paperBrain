"use client";

import { Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type QuickCaptureTriggerProps = {
  onClick?: () => void;
  className?: string;
};

/** Compact always-visible sidebar entry that opens Quick Capture. */
export function QuickCaptureTrigger({
  onClick,
  className,
}: QuickCaptureTriggerProps) {
  const [shortcut, setShortcut] = useState("⌘⇧N");

  useEffect(() => {
    const isApple =
      /Mac|iPhone|iPad|iPod/i.test(navigator.platform) ||
      /Mac/i.test(navigator.userAgent);
    setShortcut(isApple ? "⌘⇧N" : "Ctrl+Shift+N");
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full min-h-11 items-center gap-2.5 rounded-lg border border-dashed border-border bg-surface/80 px-3 py-2.5 text-left text-sm text-muted transition-colors duration-fast ease-out",
        "hover:border-accent/40 hover:bg-hover hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        className
      )}
      aria-label="Quick capture"
    >
      <Zap
        className="size-3.5 shrink-0 text-accent"
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="flex-1 truncate">Quick capture…</span>
      <kbd className="hidden rounded border border-border-subtle bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-subtle sm:inline-block">
        {shortcut}
      </kbd>
    </button>
  );
}
