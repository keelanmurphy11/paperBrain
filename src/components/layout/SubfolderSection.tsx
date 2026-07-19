"use client";

import { Folder as FolderIcon } from "lucide-react";
import { folderNoteCount } from "@/hooks/use-folders";
import type { Folder, Note } from "@/types";
import { cn } from "@/lib/utils";

type SubfolderSectionProps = {
  subfolders: Folder[];
  notes: Note[];
  onSelect: (folderId: string) => void;
  className?: string;
};

export function SubfolderSection({
  subfolders,
  notes,
  onSelect,
  className,
}: SubfolderSectionProps) {
  if (subfolders.length === 0) return null;

  return (
    <section className={cn("px-4 pb-2 pt-1 md:px-6", className)}>
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-subtle">
        Folders
      </p>
      <ul className="flex flex-wrap gap-2">
        {subfolders.map((folder) => {
          const count = folderNoteCount(notes, folder.id);
          return (
            <li key={folder.id}>
              <button
                type="button"
                onClick={() => onSelect(folder.id)}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-lg border border-border-subtle bg-background px-3 py-2 text-left transition-colors duration-fast ease-out",
                  "hover:border-border hover:bg-hover",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                )}
              >
                <FolderIcon
                  className="size-3.5 shrink-0 text-accent"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span className="max-w-[10rem] truncate text-sm text-foreground">
                  {folder.name}
                </span>
                <span className="text-[11px] tabular-nums text-muted-subtle">
                  {count}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
