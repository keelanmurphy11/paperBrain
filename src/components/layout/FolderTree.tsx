"use client";

import {
  ChevronDown,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DeleteFolderDialog } from "@/components/layout/DeleteFolderDialog";
import { SidebarNavItem } from "@/components/layout/SidebarNavItem";
import {
  folderNoteCount,
  getChildFolders,
  getRootFolders,
  useCreateFolder,
  useDeleteFolder,
  useFolders,
  useMoveNoteToFolder,
  useRenameFolder,
} from "@/hooks/use-folders";
import type { DeleteFolderMode } from "@/lib/folders-api";
import { folderPath } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast";
import { useUiStore } from "@/store/ui";
import type { Folder, FolderId, Note } from "@/types";

type FolderTreeProps = {
  notes: Note[];
  onNewNoteInFolder: (folderId: FolderId) => void;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
};

type MenuState = {
  folderId: FolderId;
  x: number;
  y: number;
} | null;

type PendingDelete = {
  folder: Folder;
  noteCount: number;
} | null;

/**
 * User-created folders only (Inbox is pinned separately in the sidebar).
 * Rows are route Links; note lists live on Folder View.
 */
export function FolderTree({
  notes,
  onNewNoteInFolder,
  isLoading,
  isError,
  errorMessage,
}: FolderTreeProps) {
  const pathname = usePathname();
  const activeFolderId = pathname.startsWith("/folder/")
    ? pathname.slice("/folder/".length).split("/")[0] ?? null
    : null;

  const setLastFolderId = useUiStore((s) => s.setLastFolderId);
  const setMobileHomePane = useUiStore((s) => s.setMobileHomePane);

  const { data: folders = [], isLoading: foldersLoading } = useFolders();
  const createFolder = useCreateFolder();
  const renameFolder = useRenameFolder();
  const deleteFolder = useDeleteFolder();
  const moveNote = useMoveNoteToFolder();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [menu, setMenu] = useState<MenuState>(null);
  const [renamingId, setRenamingId] = useState<FolderId | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [dropTargetId, setDropTargetId] = useState<FolderId | null>(null);

  const roots = useMemo(
    () => getRootFolders(folders).filter((f) => !f.is_inbox),
    [folders]
  );

  useEffect(() => {
    setExpanded((prev) => {
      let next = prev;
      const ensure = (id: string) => {
        if (next[id]) return;
        if (next === prev) next = { ...prev };
        next[id] = true;
      };
      if (activeFolderId) {
        ensure(activeFolderId);
        const active = folders.find((f) => f.id === activeFolderId);
        if (active?.parent_id) ensure(active.parent_id);
      }
      return next;
    });
  }, [folders, activeFolderId]);

  const toggleExpanded = useCallback((id: FolderId) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const openMenu = useCallback(
    (
      folderId: FolderId,
      point: { clientX: number; clientY: number },
      event?: { preventDefault?: () => void; stopPropagation?: () => void }
    ) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      setMenu({
        folderId,
        x: point.clientX,
        y: point.clientY,
      });
    },
    []
  );

  const navigateToFolder = useCallback(
    (folderId: FolderId) => {
      setLastFolderId(folderId);
      setMobileHomePane("folders");
    },
    [setLastFolderId, setMobileHomePane]
  );

  const handleCreateFolder = useCallback(
    async (parentId: FolderId | null) => {
      try {
        const folder = await createFolder.mutateAsync({
          name: parentId ? "New subfolder" : "New folder",
          parentId,
        });
        if (parentId) {
          setExpanded((prev) => ({
            ...prev,
            [parentId]: true,
            [folder.id]: true,
          }));
        } else {
          setExpanded((prev) => ({ ...prev, [folder.id]: true }));
        }
        setRenamingId(folder.id);
      } catch (err) {
        console.error("Failed to create folder", err);
        toast(
          err instanceof Error ? err.message : "Couldn’t create folder",
          "error"
        );
      }
    },
    [createFolder]
  );

  const handleRename = useCallback(
    async (id: FolderId, name: string) => {
      const folder = folders.find((f) => f.id === id);
      if (!folder || folder.is_inbox) {
        setRenamingId(null);
        return;
      }
      const trimmed = name.trim();
      if (!trimmed || trimmed === folder.name) {
        setRenamingId(null);
        return;
      }
      try {
        await renameFolder.mutateAsync({ id, name: trimmed });
        setRenamingId(null);
      } catch (err) {
        console.error("Failed to rename folder", err);
        toast(
          err instanceof Error ? err.message : "Couldn’t rename folder",
          "error"
        );
      }
    },
    [folders, renameFolder]
  );

  const handleDeleteConfirm = useCallback(
    async (mode: DeleteFolderMode) => {
      if (!pendingDelete) return;
      try {
        await deleteFolder.mutateAsync({
          id: pendingDelete.folder.id,
          mode,
        });
        setPendingDelete(null);
        toast("Folder deleted", "success");
      } catch (err) {
        console.error("Failed to delete folder", err);
        toast(
          err instanceof Error ? err.message : "Couldn’t delete folder",
          "error"
        );
      }
    },
    [deleteFolder, pendingDelete]
  );

  const handleDropOnFolder = useCallback(
    async (folderId: FolderId, noteId: string) => {
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

  const menuFolder = menu
    ? folders.find((f) => f.id === menu.folderId) ?? null
    : null;

  const loading = isLoading || foldersLoading;

  return (
    <div className="pb-4">
      <div className="flex items-center gap-1 px-3 pb-1 pt-4">
        <p className="flex-1 text-[11px] font-medium uppercase tracking-wider text-muted-subtle">
          Folders
        </p>
        <button
          type="button"
          title="New folder"
          aria-label="New folder"
          onClick={() => void handleCreateFolder(null)}
          disabled={createFolder.isPending}
          className="flex size-7 items-center justify-center rounded-md text-muted-subtle transition-colors duration-fast ease-out hover:bg-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        >
          <FolderPlus className="size-3.5" strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      {loading ? (
        <FolderTreeSkeleton />
      ) : isError ? (
        <div className="px-4 py-6">
          <p className="text-sm text-danger" role="alert">
            {errorMessage ?? "Couldn’t load folders"}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-0.5 px-2">
          {roots.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              folders={folders}
              notes={notes}
              depth={0}
              expanded={expanded}
              renamingId={renamingId}
              activeFolderId={activeFolderId}
              dropTargetId={dropTargetId}
              onToggle={toggleExpanded}
              onNavigate={navigateToFolder}
              onOpenMenu={openMenu}
              onRenameSubmit={handleRename}
              onRenameCancel={() => setRenamingId(null)}
              onDropTargetChange={setDropTargetId}
              onDropNote={handleDropOnFolder}
            />
          ))}

          {roots.length === 0 ? (
            <li className="px-3 py-4 text-center text-xs text-muted-subtle">
              No folders yet
            </li>
          ) : null}
        </ul>
      )}

      {menu && menuFolder ? (
        <FolderContextMenu
          x={menu.x}
          y={menu.y}
          folder={menuFolder}
          onClose={() => setMenu(null)}
          onNewNote={() => {
            setMenu(null);
            onNewNoteInFolder(menuFolder.id);
          }}
          onNewSubfolder={() => {
            setMenu(null);
            void handleCreateFolder(menuFolder.id);
          }}
          onRename={() => {
            setMenu(null);
            setRenamingId(menuFolder.id);
          }}
          onDelete={() => {
            setMenu(null);
            setPendingDelete({
              folder: menuFolder,
              noteCount: folderNoteCount(notes, menuFolder.id),
            });
          }}
        />
      ) : null}

      <DeleteFolderDialog
        open={Boolean(pendingDelete)}
        folderName={pendingDelete?.folder.name ?? ""}
        noteCount={pendingDelete?.noteCount ?? 0}
        busy={deleteFolder.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={(mode) => void handleDeleteConfirm(mode)}
      />
    </div>
  );
}

function FolderNode({
  folder,
  folders,
  notes,
  depth,
  expanded,
  renamingId,
  activeFolderId,
  dropTargetId,
  onToggle,
  onNavigate,
  onOpenMenu,
  onRenameSubmit,
  onRenameCancel,
  onDropTargetChange,
  onDropNote,
}: {
  folder: Folder;
  folders: Folder[];
  notes: Note[];
  depth: number;
  expanded: Record<string, boolean>;
  renamingId: FolderId | null;
  activeFolderId: string | null;
  dropTargetId: FolderId | null;
  onToggle: (id: FolderId) => void;
  onNavigate: (folderId: FolderId) => void;
  onOpenMenu: (
    folderId: FolderId,
    point: { clientX: number; clientY: number },
    event?: { preventDefault?: () => void; stopPropagation?: () => void }
  ) => void;
  onRenameSubmit: (id: FolderId, name: string) => void;
  onRenameCancel: () => void;
  onDropTargetChange: (id: FolderId | null) => void;
  onDropNote: (folderId: FolderId, noteId: string) => void;
}) {
  const isOpen = expanded[folder.id] ?? false;
  const children = depth === 0 ? getChildFolders(folders, folder.id) : [];
  const isActive = activeFolderId === folder.id;
  const count = folderNoteCount(notes, folder.id);
  const isRenaming = renamingId === folder.id;
  const isDropTarget = dropTargetId === folder.id;
  const longPressTimer = useRef<number | null>(null);
  const renameRef = useRef<HTMLInputElement>(null);
  const hasChildren = children.length > 0;

  useEffect(() => {
    if (!isRenaming) return;
    renameRef.current?.focus();
    renameRef.current?.select();
  }, [isRenaming]);

  function clearLongPress() {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  return (
    <li
      onTouchStart={(e) => {
        const touch = e.touches[0];
        if (!touch) return;
        longPressTimer.current = window.setTimeout(() => {
          onOpenMenu(folder.id, {
            clientX: touch.clientX,
            clientY: touch.clientY,
          });
        }, 480);
      }}
      onTouchEnd={clearLongPress}
      onTouchMove={clearLongPress}
    >
      {isRenaming ? (
        <div
          className="flex min-h-9 items-center px-2"
          style={{ paddingLeft: 8 + depth * 12 + 24 }}
        >
          <input
            ref={renameRef}
            defaultValue={folder.name}
            aria-label="Rename folder"
            className="w-full rounded border border-border bg-surface px-1.5 py-0.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30"
            onBlur={(e) => onRenameSubmit(folder.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onRenameSubmit(folder.id, e.currentTarget.value);
              } else if (e.key === "Escape") {
                e.preventDefault();
                onRenameCancel();
              }
            }}
          />
        </div>
      ) : (
        <SidebarNavItem
          href={folderPath(folder.id)}
          label={folder.name}
          count={count}
          active={isActive}
          depth={depth}
          onNavigate={() => {
            onNavigate(folder.id);
            if (hasChildren && !isOpen) onToggle(folder.id);
          }}
          dropFolderId={folder.id}
          onDropNote={onDropNote}
          isDropTarget={isDropTarget}
          onDropTargetChange={onDropTargetChange}
          onContextMenu={(e) => {
            onOpenMenu(
              folder.id,
              { clientX: e.clientX, clientY: e.clientY },
              e
            );
          }}
          leading={
            hasChildren ? (
              <button
                type="button"
                aria-expanded={isOpen}
                aria-label={isOpen ? "Collapse folder" : "Expand folder"}
                onClick={(e) => {
                  e.preventDefault();
                  onToggle(folder.id);
                }}
                className="flex size-6 shrink-0 items-center justify-center rounded text-muted-subtle transition-colors duration-fast ease-out hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform duration-fast ease-out",
                    isOpen ? "rotate-0" : "-rotate-90"
                  )}
                  strokeWidth={1.75}
                  aria-hidden
                />
              </button>
            ) : (
              <span className="size-6 shrink-0" aria-hidden />
            )
          }
          trailing={
            <button
              type="button"
              title="Folder actions"
              aria-label={`Actions for ${folder.name}`}
              onClick={(e) => {
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                onOpenMenu(
                  folder.id,
                  { clientX: rect.right, clientY: rect.bottom },
                  e
                );
              }}
              className={cn(
                "mr-0.5 flex size-6 shrink-0 items-center justify-center rounded text-muted-subtle transition-colors duration-fast ease-out",
                "opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100",
                "hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              )}
            >
              <MoreHorizontal
                className="size-3.5"
                strokeWidth={1.75}
                aria-hidden
              />
            </button>
          }
        />
      )}

      {isOpen && hasChildren ? (
        <ul className="flex flex-col gap-0.5">
          {children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              folders={folders}
              notes={notes}
              depth={1}
              expanded={expanded}
              renamingId={renamingId}
              activeFolderId={activeFolderId}
              dropTargetId={dropTargetId}
              onToggle={onToggle}
              onNavigate={onNavigate}
              onOpenMenu={onOpenMenu}
              onRenameSubmit={onRenameSubmit}
              onRenameCancel={onRenameCancel}
              onDropTargetChange={onDropTargetChange}
              onDropNote={onDropNote}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function FolderContextMenu({
  x,
  y,
  folder,
  onClose,
  onNewNote,
  onNewSubfolder,
  onRename,
  onDelete,
}: {
  x: number;
  y: number;
  folder: Folder;
  onClose: () => void;
  onNewNote: () => void;
  onNewSubfolder: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const canNest = !folder.parent_id;
  const canMutate = !folder.is_inbox;

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) onClose();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const style = useMemo(() => {
    const menuWidth = 180;
    const menuHeight = 200;
    const left = Math.min(x, window.innerWidth - menuWidth - 8);
    const top = Math.min(y, window.innerHeight - menuHeight - 8);
    return { left: Math.max(8, left), top: Math.max(8, top) };
  }, [x, y]);

  const items: {
    key: string;
    label: string;
    icon: typeof Plus;
    onClick: () => void;
    danger?: boolean;
    hidden?: boolean;
  }[] = [
    {
      key: "note",
      label: "New note",
      icon: Plus,
      onClick: onNewNote,
    },
    {
      key: "sub",
      label: "New subfolder",
      icon: FolderPlus,
      onClick: onNewSubfolder,
      hidden: !canNest,
    },
    {
      key: "rename",
      label: "Rename",
      icon: Pencil,
      onClick: onRename,
      hidden: !canMutate,
    },
    {
      key: "delete",
      label: "Delete",
      icon: Trash2,
      onClick: onDelete,
      danger: true,
      hidden: !canMutate,
    },
  ];

  return (
    <div
      ref={ref}
      role="menu"
      style={style}
      className="fixed z-50 min-w-[11rem] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg"
    >
      {items
        .filter((item) => !item.hidden)
        .map((item) => (
          <button
            key={item.key}
            type="button"
            role="menuitem"
            onClick={item.onClick}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors duration-fast ease-out",
              "focus-visible:outline-none focus-visible:bg-hover",
              item.danger
                ? "text-danger hover:bg-danger-subtle"
                : "text-foreground hover:bg-hover"
            )}
          >
            <item.icon
              className="size-3.5 shrink-0"
              strokeWidth={1.75}
              aria-hidden
            />
            {item.label}
          </button>
        ))}
    </div>
  );
}

function FolderTreeSkeleton() {
  return (
    <div className="flex flex-col gap-1 px-3 pb-4" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex h-8 items-center gap-2 rounded-md px-2"
          style={{ paddingLeft: 8 + (i % 2) * 12 }}
        >
          <div className="h-3 max-w-[7rem] flex-1 animate-pulse rounded bg-border-subtle" />
          <div className="h-2.5 w-4 animate-pulse rounded bg-border-subtle" />
        </div>
      ))}
    </div>
  );
}
