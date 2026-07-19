"use client";

import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type MobileBackHeaderProps = {
  label?: string;
  onBack: () => void;
  className?: string;
};

/** Top-left back control for pushed mobile screens (hidden on md+). */
export function MobileBackHeader({
  label = "Back",
  onBack,
  className,
}: MobileBackHeaderProps) {
  return (
    <button
      type="button"
      onClick={onBack}
      className={cn(
        "inline-flex min-h-11 items-center gap-0.5 rounded-lg px-2 text-sm text-accent transition-colors duration-fast ease-out hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 md:hidden",
        className
      )}
    >
      <ChevronLeft className="size-5" strokeWidth={1.75} aria-hidden />
      {label}
    </button>
  );
}
