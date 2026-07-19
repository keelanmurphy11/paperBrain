"use client";

import { Link2, Plus } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useCreateSource } from "@/hooks/use-sources";
import { normalizeUrl } from "@/lib/url";
import type { Source } from "@/types";
import { cn } from "@/lib/utils";

type AddSourceFormProps = {
  noteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSourceCreated: (source: Source) => void;
};

export function AddSourceForm({
  noteId,
  open,
  onOpenChange,
  onSourceCreated,
}: AddSourceFormProps) {
  const createSource = useCreateSource(noteId);
  const urlRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUrl("");
    setTitle("");
    setError(null);
    const id = window.setTimeout(() => urlRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  async function resolveTitle(pageUrl: string): Promise<string | null> {
    try {
      const res = await fetch("/api/fetch-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: pageUrl }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { title?: string | null };
      return data.title?.trim() || null;
    } catch {
      return null;
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const normalized = normalizeUrl(url);
    if (!normalized) {
      setError("Enter a URL");
      return;
    }

    try {
      new URL(normalized);
    } catch {
      setError("That doesn’t look like a valid URL");
      return;
    }

    let resolvedTitle = title.trim() || null;
    if (!resolvedTitle) {
      setResolving(true);
      resolvedTitle = await resolveTitle(normalized);
      setResolving(false);
    }

    try {
      const source = await createSource.mutateAsync({
        url: normalized,
        title: resolvedTitle,
      });
      onSourceCreated(source);
      onOpenChange(false);
    } catch {
      setError("Couldn’t add source");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className={cn(
          "inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-xs text-muted-subtle",
          "transition-colors duration-fast ease-out hover:bg-hover hover:text-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        )}
      >
        <Plus className="size-3.5" strokeWidth={1.75} aria-hidden />
        Add source
      </button>
    );
  }

  const busy = createSource.isPending || resolving;

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="mt-2 rounded-lg border border-border-subtle bg-background/70 p-3"
    >
      <div className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-muted">
        <Link2 className="size-3.5" strokeWidth={1.75} aria-hidden />
        Add source at cursor
      </div>

      <div className="space-y-2">
        <input
          ref={urlRef}
          type="url"
          inputMode="url"
          required
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={busy}
          className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-subtle focus:border-accent disabled:opacity-60"
        />
        <input
          type="text"
          placeholder="Title (optional — fetched if blank)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={busy}
          className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-subtle focus:border-accent disabled:opacity-60"
        />
      </div>

      {error ? (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-2.5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={busy}
          className="rounded-md px-2.5 py-1 text-xs text-muted transition-colors duration-fast ease-out hover:bg-hover hover:text-foreground disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy || !url.trim()}
          className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-white transition-colors duration-fast ease-out hover:bg-accent-hover disabled:opacity-60"
        >
          {resolving
            ? "Fetching title…"
            : createSource.isPending
              ? "Adding…"
              : "Add"}
        </button>
      </div>
    </form>
  );
}
