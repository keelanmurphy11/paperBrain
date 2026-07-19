"use client";

import { QuickCaptureTrigger } from "@/components/capture/QuickCaptureTrigger";
import { FolderTree } from "@/components/layout/FolderTree";
import { NewNoteButton } from "@/components/layout/NewNoteButton";
import { SearchTrigger } from "@/components/layout/SearchTrigger";
import { SettingsMenu } from "@/components/layout/SettingsMenu";
import { TagsSection } from "@/components/layout/TagsSection";
import type { FolderId, Note } from "@/types";
import { cn } from "@/lib/utils";

type SidebarProps = {
  notes: Note[];
  selectedId: string | null;
  selectedTagId: string | null;
  activeFolderId: string | null;
  onSelectNote: (id: string) => void;
  onSelectTag: (tagId: string | null) => void;
  onSelectFolder: (folderId: FolderId) => void;
  onNewNote: () => void;
  onNewNoteInFolder: (folderId: FolderId) => void;
  onOpenSearch: () => void;
  onOpenQuickCapture: () => void;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  creating?: boolean;
  className?: string;
};

export function Sidebar({
  notes,
  selectedId,
  selectedTagId,
  activeFolderId,
  onSelectNote,
  onSelectTag,
  onSelectFolder,
  onNewNote,
  onNewNoteInFolder,
  onOpenSearch,
  onOpenQuickCapture,
  isLoading,
  isError,
  errorMessage,
  creating,
  className,
}: SidebarProps) {
  return (
    <aside
      className={cn("flex h-full w-full flex-col bg-background", className)}
    >
      <div className="flex flex-col gap-3 px-4 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))] md:pt-6">
        <div className="flex items-center gap-2 px-0.5">
          <span
            className="flex size-6 items-center justify-center rounded-md bg-accent text-[11px] font-semibold tracking-tight text-white"
            aria-hidden
          >
            p
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            paperBrain
          </span>
        </div>

        <NewNoteButton onClick={onNewNote} disabled={creating} />
        <QuickCaptureTrigger onClick={onOpenQuickCapture} />
        <SearchTrigger onClick={onOpenSearch} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <TagsSection
          selectedTagId={selectedTagId}
          onSelectTag={onSelectTag}
        />

        <FolderTree
          notes={notes}
          selectedNoteId={selectedId}
          activeFolderId={activeFolderId}
          onSelectNote={onSelectNote}
          onSelectFolder={onSelectFolder}
          onNewNoteInFolder={onNewNoteInFolder}
          isLoading={isLoading}
          isError={isError}
          errorMessage={errorMessage}
        />
      </div>

      <div className="shrink-0 border-t border-border-subtle px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <SettingsMenu />
      </div>
    </aside>
  );
}
