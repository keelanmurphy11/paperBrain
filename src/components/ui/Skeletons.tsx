import { cn } from "@/lib/utils";

export function NoteListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-0.5 px-2 pb-4" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          {i > 0 ? (
            <div className="mx-3 border-t border-border-subtle" />
          ) : null}
          <div className="rounded-lg px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="h-3.5 w-2/5 max-w-[9rem] animate-pulse rounded bg-border-subtle" />
              <div className="h-3 w-10 animate-pulse rounded bg-border-subtle" />
            </div>
            <div className="mt-2.5 h-3 w-full animate-pulse rounded bg-border-subtle" />
            <div className="mt-1.5 h-3 w-4/5 animate-pulse rounded bg-border-subtle" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NoteEditorSkeleton({ className }: { className?: string }) {
  return (
    <section
      className={cn("flex h-full min-h-0 flex-col bg-surface", className)}
      aria-busy="true"
      aria-label="Loading note"
    >
      <div className="flex shrink-0 items-center justify-end gap-2 px-2 pt-2 md:px-4 md:pt-3">
        <div className="size-11 animate-pulse rounded-lg bg-border-subtle" />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto w-full max-w-editor px-4 pb-24 pt-4 md:px-12 md:pt-8">
          <div className="h-8 w-3/5 max-w-sm animate-pulse rounded-md bg-border-subtle" />
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-16 animate-pulse rounded-md bg-border-subtle" />
            <div className="h-6 w-14 animate-pulse rounded-md bg-border-subtle" />
          </div>
          <div className="mt-8 space-y-3">
            <div className="h-3.5 w-full animate-pulse rounded bg-border-subtle" />
            <div className="h-3.5 w-[92%] animate-pulse rounded bg-border-subtle" />
            <div className="h-3.5 w-[88%] animate-pulse rounded bg-border-subtle" />
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-border-subtle" />
            <div className="mt-6 h-3.5 w-full animate-pulse rounded bg-border-subtle" />
            <div className="h-3.5 w-[85%] animate-pulse rounded bg-border-subtle" />
          </div>
        </div>
      </div>
    </section>
  );
}
