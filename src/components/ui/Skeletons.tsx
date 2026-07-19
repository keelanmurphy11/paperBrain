import { cn } from "@/lib/utils";

export function NoteListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          {i > 0 ? (
            <div className="ml-4 border-t border-border-subtle md:ml-5" />
          ) : null}
          <div className="flex items-stretch gap-3 px-4 py-3.5 md:px-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="h-3.5 w-2/5 max-w-[10rem] animate-pulse rounded bg-border-subtle" />
                <div className="h-3 w-10 animate-pulse rounded bg-border-subtle" />
              </div>
              <div className="mt-2.5 h-3 w-full animate-pulse rounded bg-border-subtle" />
              <div className="mt-1.5 h-3 w-4/5 animate-pulse rounded bg-border-subtle" />
            </div>
            {i % 3 === 0 ? (
              <div className="size-14 shrink-0 animate-pulse rounded-md bg-border-subtle" />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Compact list placeholder for in-sidebar / overlay search fetches. */
export function SearchResultsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col" aria-hidden aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          {i > 0 ? (
            <div className="ml-3 border-t border-border-subtle" />
          ) : null}
          <div className="px-3 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="h-3.5 w-2/5 max-w-[9rem] animate-pulse rounded bg-border-subtle" />
              <div className="h-3 w-8 animate-pulse rounded bg-border-subtle" />
            </div>
            <div className="mt-2 h-3 w-full animate-pulse rounded bg-border-subtle" />
            <div className="mt-1.5 h-3 w-3/4 animate-pulse rounded bg-border-subtle" />
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
      <div className="flex shrink-0 items-center justify-between gap-2 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] md:px-4 md:pt-3">
        <div className="h-8 w-16 animate-pulse rounded-md bg-border-subtle md:hidden" />
        <div className="ml-auto flex gap-2 pr-1">
          <div className="h-4 w-12 animate-pulse rounded bg-border-subtle" />
          <div className="size-8 animate-pulse rounded-md bg-border-subtle" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-editor px-4 pb-24 pt-6 md:px-12 md:pt-14">
        <div className="h-8 w-3/5 max-w-sm animate-pulse rounded bg-border-subtle" />
        <div className="mt-6 space-y-3">
          <div className="h-3.5 w-full animate-pulse rounded bg-border-subtle" />
          <div className="h-3.5 w-11/12 animate-pulse rounded bg-border-subtle" />
          <div className="h-3.5 w-4/5 animate-pulse rounded bg-border-subtle" />
        </div>
      </div>
    </section>
  );
}
