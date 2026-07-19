"use client";

import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { FolderTree } from "@/components/layout/FolderTree";
import { SettingsMenu } from "@/components/layout/SettingsMenu";
import { SidebarNavItem } from "@/components/layout/SidebarNavItem";
import { SidebarSearch } from "@/components/search/SidebarSearch";
import {
  folderNoteCount,
  getChildFolders,
  useFolders,
  useMoveNoteToFolder,
} from "@/hooks/use-folders";
import { useNotes } from "@/hooks/use-notes";
import { folderPath, HOME_PATH } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast";
import { useUiStore } from "@/store/ui";
import type { FolderId, Note } from "@/types";

type SidebarProps = {
  notes?: Note[];
  isMobileFolderList?: boolean;
  onNewNoteInFolder: (folderId: FolderId) => void;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  className?: string;
};

/**
 * Pure navigation rail: search → All Notes → Inbox → user folders.
 * Typing in search swaps the folder list for live results.
 */
export function Sidebar({
  notes: notesProp,
  isMobileFolderList = false,
  onNewNoteInFolder,
  isLoading,
  isError,
  errorMessage,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const { data: queriedNotes = [] } = useNotes();
  const notes = notesProp ?? queriedNotes;
  const { data: folders = [] } = useFolders();
  const moveNote = useMoveNoteToFolder();

  const setMobileHomePane = useUiStore((s) => s.setMobileHomePane);
  const setLastFolderId = useUiStore((s) => s.setLastFolderId);

  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const inbox = useMemo(
    () => folders.find((f) => f.is_inbox) ?? null,
    [folders]
  );

  const inboxChildren = useMemo(
    () => (inbox ? getChildFolders(folders, inbox.id) : []),
    [folders, inbox]
  );

  const activeFolderId = pathname.startsWith("/folder/")
    ? pathname.slice("/folder/".length).split("/")[0] ?? null
    : null;

  const allNotesActive = pathname === "/" && !isMobileFolderList;
  const inboxActive = Boolean(inbox && activeFolderId === inbox.id);
  const inboxCount = inbox ? folderNoteCount(notes, inbox.id) : 0;

  const handleDropOnFolder = useCallback(
    async (folderId: string, noteId: string) => {
      setDropTargetId(null);
      const note = notes.find((n) => n.id === noteId);
      if (!note || note.folder_id === folderId) return;
      try {
        await moveNote.mutateAsync({ noteId, folderId });
      } catch (err) {
        console.error("Failed to move note", err);
        toast(
          err instanceof Error ? err.message : "Couldn’t move note",
          "error"
        );
      }
    },
    [moveNote, notes]
  );

  return (
    <aside
      className={cn("flex h-full w-full flex-col bg-background", className)}
    >
      <div className="shrink-0 px-3 pb-1 pt-[max(1rem,env(safe-area-inset-top))] md:pt-5">
        <p className="px-1 text-[15px] font-semibold tracking-tight text-foreground md:sr-only">
          Folders
        </p>
        <div className="mb-3 hidden items-center gap-2 px-1 md:flex">
          <span
            className="flex size-5 items-center justify-center rounded bg-accent text-[10px] font-semibold tracking-tight text-white"
            aria-hidden
          >
            p
          </span>
          <span className="text-[13px] font-medium tracking-tight text-foreground">
            paperBrain
          </span>
        </div>
      </div>

      <SidebarSearch>
        <nav aria-label="Notes navigation">
          <ul className="flex flex-col gap-0.5 px-2 pt-1">
            <li>
              <SidebarNavItem
                href={HOME_PATH}
                label="All Notes"
                count={notes.length}
                active={allNotesActive}
                onNavigate={() => setMobileHomePane("all-notes")}
              />
            </li>

            {inbox ? (
              <li>
                <SidebarNavItem
                  href={folderPath(inbox.id)}
                  label="Inbox"
                  count={inboxCount}
                  active={inboxActive}
                  dropFolderId={inbox.id}
                  onDropNote={handleDropOnFolder}
                  isDropTarget={dropTargetId === inbox.id}
                  onDropTargetChange={setDropTargetId}
                  onNavigate={() => {
                    setLastFolderId(inbox.id);
                    setMobileHomePane("folders");
                  }}
                />
                {inboxChildren.length > 0 ? (
                  <ul className="flex flex-col gap-0.5">
                    {inboxChildren.map((child) => (
                      <li key={child.id}>
                        <SidebarNavItem
                          href={folderPath(child.id)}
                          label={child.name}
                          count={folderNoteCount(notes, child.id)}
                          active={activeFolderId === child.id}
                          depth={1}
                          dropFolderId={child.id}
                          onDropNote={handleDropOnFolder}
                          isDropTarget={dropTargetId === child.id}
                          onDropTargetChange={setDropTargetId}
                          onNavigate={() => {
                            setLastFolderId(child.id);
                            setMobileHomePane("folders");
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ) : null}
          </ul>

          <FolderTree
            notes={notes}
            onNewNoteInFolder={onNewNoteInFolder}
            isLoading={isLoading}
            isError={isError}
            errorMessage={errorMessage}
          />
        </nav>
      </SidebarSearch>

      <div className="shrink-0 border-t border-border-subtle px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <SettingsMenu />
      </div>
    </aside>
  );
}
