"use client";

import { FileText, Lightbulb } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import {
  NOTE_TEMPLATES,
  type NoteTemplateId,
} from "@/lib/note-templates";
import { cn } from "@/lib/utils";

type TemplatePickerProps = {
  open: boolean;
  busy?: boolean;
  onSelect: (templateId: NoteTemplateId) => void;
  onCancel: () => void;
};

export function TemplatePicker({
  open,
  busy,
  onSelect,
  onCancel,
}: TemplatePickerProps) {
  const titleId = useId();
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    firstRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!busy) onCancel();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel, busy]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 px-4 pb-8 pt-[max(18vh,env(safe-area-inset-top))]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
      >
        <div className="border-b border-border-subtle px-4 py-3">
          <h2
            id={titleId}
            className="text-sm font-medium text-foreground"
          >
            New note
          </h2>
          <p className="mt-0.5 text-xs text-muted-subtle">
            Optional starting structure — you can change anything later
          </p>
        </div>

        <ul className="flex flex-col gap-1.5 p-2.5">
          {NOTE_TEMPLATES.map((template, index) => {
            const Icon = template.id === "fact" ? Lightbulb : FileText;
            return (
              <li key={template.id}>
                <button
                  ref={index === 0 ? firstRef : undefined}
                  type="button"
                  disabled={busy}
                  onClick={() => onSelect(template.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors duration-fast ease-out",
                    "hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                    "disabled:opacity-60"
                  )}
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-accent-subtle text-accent">
                    <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">
                      {template.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {template.description}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex justify-end border-t border-border-subtle px-3 py-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex min-h-9 items-center rounded-lg px-3 text-sm text-muted transition-colors duration-fast ease-out hover:bg-hover hover:text-foreground disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
