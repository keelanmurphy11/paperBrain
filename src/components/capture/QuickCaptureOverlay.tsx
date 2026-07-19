"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Link2, Zap } from "lucide-react";
import {
  useEffect,
  useId,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useQuickCapture } from "@/hooks/use-quick-capture";
import { EMPTY_DOC } from "@/lib/notes";
import type { TipTapDoc } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast";

type QuickCaptureOverlayProps = {
  open: boolean;
  onClose: () => void;
};

export function QuickCaptureOverlay({
  open,
  onClose,
}: QuickCaptureOverlayProps) {
  const titleId = useId();
  const [sourceUrl, setSourceUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const capture = useQuickCapture();
  const busy = capture.isPending;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Placeholder.configure({
        placeholder: "Capture a thought…",
      }),
    ],
    content: EMPTY_DOC as JSONContent,
    editorProps: {
      attributes: {
        class:
          "quick-capture-editor ProseMirror min-h-[7.5rem] max-h-[40vh] overflow-y-auto px-1 py-0.5 text-sm leading-relaxed text-foreground focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!open) return;

    setSourceUrl("");
    setError(null);
    capture.reset();

    const id = window.setTimeout(() => {
      editor?.commands.clearContent(true);
      editor?.commands.focus("end");
    }, 0);

    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when opening
  }, [open, editor]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!busy) onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, busy]);

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (!editor || busy) return;

    setError(null);
    const content = editor.getJSON() as TipTapDoc;
    const contentText = editor.getText({ blockSeparator: "\n" }).trim();
    const url = sourceUrl.trim();

    if (!contentText && !url) {
      setError("Write something or paste a source URL");
      editor.commands.focus();
      return;
    }

    try {
      await capture.mutateAsync({
        content,
        contentText,
        sourceUrl: url || undefined,
      });
      onClose();
      toast("Saved to Inbox", "success");
    } catch (err) {
      console.error("Quick capture failed", err);
      setError(
        err instanceof Error ? err.message : "Couldn’t save — try again"
      );
    }
  }

  function handleEditorKeyDown(event: ReactKeyboardEvent) {
    const mod = event.metaKey || event.ctrlKey;
    if (mod && event.key === "Enter") {
      event.preventDefault();
      void handleSubmit();
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/25 px-4 pb-8 pt-[max(12vh,env(safe-area-inset-top))] sm:pt-[14vh]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={(e) => void handleSubmit(e)}
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        onKeyDown={handleEditorKeyDown}
      >
        <div className="flex items-center gap-2 border-b border-border-subtle px-3.5 py-2.5">
          <span className="flex size-6 items-center justify-center rounded-md bg-accent-subtle text-accent">
            <Zap className="size-3.5" strokeWidth={1.75} aria-hidden />
          </span>
          <h2
            id={titleId}
            className="flex-1 text-sm font-medium text-foreground"
          >
            Quick capture
          </h2>
          <kbd className="hidden rounded border border-border-subtle bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-subtle sm:inline-block">
            esc
          </kbd>
        </div>

        <div className="px-3.5 pt-3">
          <EditorContent editor={editor} />
        </div>

        <div className="mt-2 flex items-center gap-2 border-t border-border-subtle px-3.5 py-2.5">
          <Link2
            className="size-3.5 shrink-0 text-muted-subtle"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            type="url"
            inputMode="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            disabled={busy}
            placeholder="Paste a source URL (optional)"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-subtle disabled:opacity-60"
          />
        </div>

        {error ? (
          <p className="px-3.5 pb-2 text-xs text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-2 border-t border-border-subtle px-3.5 py-2.5">
          <p className="text-[11px] text-muted-subtle">
            <span className="hidden sm:inline">
              # headings · - lists · ⌘↵ save
            </span>
            <span className="sm:hidden">Saves to Inbox</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className={cn(
                "inline-flex min-h-9 items-center rounded-lg px-3 text-sm text-muted",
                "transition-colors duration-fast ease-out hover:bg-hover hover:text-foreground",
                "disabled:opacity-60"
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className={cn(
                "inline-flex min-h-9 items-center rounded-lg bg-accent px-3 text-sm font-medium text-white",
                "transition-colors duration-fast ease-out hover:bg-accent-hover",
                "disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              )}
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
