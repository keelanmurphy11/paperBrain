"use client";

import { Plus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type NewNoteButtonProps = {
  onClick?: () => void;
  variant?: "sidebar" | "fab" | "fab-capture";
  className?: string;
  disabled?: boolean;
};

export function NewNoteButton({
  onClick,
  variant = "sidebar",
  className,
  disabled,
}: NewNoteButtonProps) {
  if (variant === "fab" || variant === "fab-capture") {
    const isCapture = variant === "fab-capture";
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={isCapture ? "Quick capture" : "New note"}
        className={cn(
          "fixed z-20 flex size-12 items-center justify-center rounded-full bg-accent text-white shadow-md",
          "bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-[max(1.5rem,env(safe-area-inset-right))]",
          "transition-all duration-fast ease-out hover:bg-accent-hover hover:shadow-lg active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-60",
          "md:hidden",
          className
        )}
      >
        {isCapture ? (
          <Zap className="size-5" strokeWidth={2} aria-hidden />
        ) : (
          <Plus className="size-5" strokeWidth={2} aria-hidden />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-3 py-3 text-sm font-medium text-white",
        "transition-colors duration-fast ease-out hover:bg-accent-hover",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-60",
        className
      )}
    >
      <Plus className="size-4" strokeWidth={2} aria-hidden />
      New Note
    </button>
  );
}
