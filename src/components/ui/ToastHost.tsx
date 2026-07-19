"use client";

import { X } from "lucide-react";
import { useToastStore } from "@/store/toast";
import { cn } from "@/lib/utils";

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-end"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.variant === "error" ? "alert" : "status"}
          className={cn(
            "pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-lg border px-3.5 py-3 shadow-md",
            "bg-surface text-sm text-foreground",
            t.variant === "error"
              ? "border-danger/30"
              : "border-border-subtle"
          )}
        >
          <p
            className={cn(
              "min-w-0 flex-1 leading-snug",
              t.variant === "error" ? "text-danger" : "text-foreground"
            )}
          >
            {t.message}
          </p>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-subtle transition-colors duration-fast ease-out hover:bg-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 sm:size-8"
          >
            <X className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
