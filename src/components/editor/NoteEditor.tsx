"use client";

import { Download, Trash2 } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { AddSourceForm } from "@/components/editor/AddSourceForm";
import { BacklinksSection } from "@/components/editor/BacklinksSection";
import { DeleteNoteDialog } from "@/components/editor/DeleteNoteDialog";
import { InsertImageButton } from "@/components/editor/InsertImageButton";
import { NoteFolderBreadcrumb } from "@/components/editor/NoteFolderBreadcrumb";
import { NoteTags } from "@/components/editor/NoteTags";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { MobileBackHeader } from "@/components/layout/MobileBackHeader";
import { useFolders } from "@/hooks/use-folders";
import { useDeleteNote, useUpdateNote } from "@/hooks/use-notes";
import { useSyncOutgoingLinks } from "@/hooks/use-links";
import { useNoteSources } from "@/hooks/use-sources";
import { collectNoteLinkIdsFromContent } from "@/components/editor/extensions/note-link";
import { exportSingleNote } from "@/lib/export-notes";
import { folderPath, HOME_PATH } from "@/lib/navigation";
import { EMPTY_DOC, isTipTapDoc } from "@/lib/notes";
import { toast } from "@/store/toast";
import { useUiStore } from "@/store/ui";
import type { Note, Source, TipTapDoc } from "@/types";
import { cn } from "@/lib/utils";
import type { Editor } from "@tiptap/react";
import { useRouter } from "next/navigation";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type NoteEditorProps = {
  note: Note | null;
  onBack?: () => void;
  showBack?: boolean;
  className?: string;
  onCreateNote?: () => void;
};

export function NoteEditor({
  note,
  onBack,
  showBack = false,
  className,
  onCreateNote,
}: NoteEditorProps) {
  if (!note) {
    return (
      <section
        className={cn("flex h-full min-h-0 flex-col bg-surface", className)}
      >
        {showBack && onBack ? (
          <MobileBackHeader onBack={onBack} label="Back" />
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-editor px-4 pb-24 pt-6 md:px-12 md:pt-14">
            <EmptyEditorState onCreateNote={onCreateNote} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <NoteEditorInner
      key={note.id}
      note={note}
      onBack={onBack}
      showBack={showBack}
      className={className}
    />
  );
}

function NoteEditorInner({
  note,
  onBack,
  showBack = false,
  className,
}: {
  note: Note;
  onBack?: () => void;
  showBack?: boolean;
  className?: string;
}) {
  const focusTitleOnOpen = useUiStore((s) => s.focusTitleOnOpen);
  const consumeFocusTitle = useUiStore((s) => s.consumeFocusTitle);
  const router = useRouter();

  const { mutateAsync: updateNoteAsync } = useUpdateNote();
  const { mutateAsync: syncLinksAsync } = useSyncOutgoingLinks();
  const deleteNote = useDeleteNote();
  const { data: folders = [] } = useFolders();
  const { data: sources = [], isSuccess: sourcesLoaded } = useNoteSources(
    note.id
  );

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const uploadImagesRef = useRef<((files: File[]) => Promise<void>) | null>(
    null
  );
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState<TipTapDoc>(
    isTipTapDoc(note.content) ? note.content : EMPTY_DOC
  );
  const [contentText, setContentText] = useState(note.content_text);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const skipNextSave = useRef(true);
  const dirtyRef = useRef(false);
  const latestRef = useRef({ title, content, contentText });
  const updateNoteRef = useRef(updateNoteAsync);
  const syncLinksRef = useRef(syncLinksAsync);

  latestRef.current = { title, content, contentText };
  updateNoteRef.current = updateNoteAsync;
  syncLinksRef.current = syncLinksAsync;

  async function persistNote(
    id: string,
    payload: { title: string; content: TipTapDoc; contentText: string }
  ) {
    await updateNoteRef.current({
      id,
      payload: {
        title: payload.title,
        content: payload.content,
        content_text: payload.contentText,
      },
    });

    const targetIds = Array.from(
      collectNoteLinkIdsFromContent(payload.content)
    ).filter((targetId) => targetId !== id);

    await syncLinksRef.current({
      sourceNoteId: id,
      targetIds,
    });
  }

  useEffect(() => {
    if (!focusTitleOnOpen) return;
    const el = titleRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
    consumeFocusTitle();
  }, [focusTitleOnOpen, consumeFocusTitle]);

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    dirtyRef.current = true;
    setSaveStatus("saving");

    const timer = window.setTimeout(async () => {
      const payload = latestRef.current;
      try {
        await persistNote(note.id, payload);
        dirtyRef.current = false;
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
        toast("Couldn’t save note", "error");
      }
    }, 800);

    return () => window.clearTimeout(timer);
  }, [title, content, contentText, note.id]);

  useEffect(() => {
    const id = note.id;
    return () => {
      if (!dirtyRef.current) return;
      const payload = latestRef.current;
      void (async () => {
        try {
          await updateNoteRef.current({
            id,
            payload: {
              title: payload.title,
              content: payload.content,
              content_text: payload.contentText,
            },
          });
          const targetIds = Array.from(
            collectNoteLinkIdsFromContent(payload.content)
          ).filter((targetId) => targetId !== id);
          await syncLinksRef.current({
            sourceNoteId: id,
            targetIds,
          });
        } catch {
          // Best-effort flush on unmount
        }
      })();
    };
  }, [note.id]);

  function handleTitleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      editorRef.current?.commands.focus("end");
    }
  }

  function handleTitleInput(value: string) {
    setTitle(value);
    const el = titleRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  function handleSourceCreated(source: Source) {
    const editor = editorRef.current;
    if (!editor) return;

    editor
      .chain()
      .focus()
      .insertSourceBlock({
        sourceId: source.id,
        url: source.url,
        title: source.title,
      })
      .run();
  }

  async function handleConfirmDelete() {
    try {
      const folderId = note.folder_id;
      await deleteNote.mutateAsync(note.id);
      setConfirmDelete(false);
      router.replace(folderId ? folderPath(folderId) : HOME_PATH);
    } catch {
      setSaveStatus("error");
      toast("Couldn’t delete note", "error");
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      // Prefer live editor JSON so unsaved edits are included
      const liveContent =
        (editorRef.current?.getJSON() as TipTapDoc | undefined) ?? content;
      await exportSingleNote(
        {
          ...note,
          title,
          content: liveContent,
          content_text: contentText,
        },
        folders
      );
      toast("Note exported", "success");
    } catch (err) {
      console.error(err);
      toast(
        err instanceof Error ? err.message : "Couldn’t export note",
        "error"
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <section
      className={cn("flex h-full min-h-0 flex-col bg-surface", className)}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] md:px-4 md:pt-3">
        {showBack && onBack ? (
          <MobileBackHeader onBack={onBack} label="Back" />
        ) : (
          <div className="hidden md:block" />
        )}

        <div className="ml-auto flex items-center gap-2 pr-1">
          <SaveIndicator status={saveStatus} />
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting}
            aria-label="Export as markdown"
            title="Export as markdown"
            className="flex size-11 items-center justify-center rounded-lg text-muted-subtle transition-colors duration-fast ease-out hover:bg-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
          >
            <Download className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete note"
            className="flex size-11 items-center justify-center rounded-lg text-muted-subtle transition-colors duration-fast ease-out hover:bg-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-editor px-4 pb-24 pt-4 md:px-12 md:pt-8">
          <NoteFolderBreadcrumb
            noteId={note.id}
            folderId={note.folder_id}
            className="mb-2"
          />

          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => handleTitleInput(e.target.value)}
            onKeyDown={handleTitleKeyDown}
            placeholder="Untitled"
            rows={1}
            className="note-title w-full resize-none overflow-hidden bg-transparent text-title text-foreground placeholder:text-muted-subtle/70 focus:outline-none"
          />

          <NoteTags noteId={note.id} />

          <div className="mt-2 flex flex-wrap items-center gap-1">
            <AddSourceForm
              noteId={note.id}
              open={addSourceOpen}
              onOpenChange={setAddSourceOpen}
              onSourceCreated={handleSourceCreated}
            />
            <InsertImageButton
              onPickFiles={async (files) => {
                const upload = uploadImagesRef.current;
                if (!upload) {
                  toast("Editor isn’t ready yet", "error");
                  return;
                }
                await upload(files);
              }}
            />
          </div>

          <div className="mt-5">
            <RichTextEditor
              noteId={note.id}
              content={content}
              sources={sources}
              sourcesReady={sourcesLoaded}
              onReady={(editor) => {
                editorRef.current = editor;
              }}
              onUploadReady={(upload) => {
                uploadImagesRef.current = upload;
              }}
              onUpdate={(nextContent, plainText) => {
                setContent(nextContent);
                setContentText(plainText);
              }}
            />
          </div>

          <BacklinksSection noteId={note.id} />
        </div>
      </div>

      <DeleteNoteDialog
        open={confirmDelete}
        noteTitle={title}
        busy={deleteNote.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </section>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  const label =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? "Saved"
        : "Couldn’t save";

  return (
    <span
      className={cn(
        "text-xs transition-opacity duration-normal ease-out",
        status === "error" ? "text-danger" : "text-muted-subtle"
      )}
      aria-live="polite"
    >
      {label}
    </span>
  );
}

function EmptyEditorState({ onCreateNote }: { onCreateNote?: () => void }) {
  return (
    <div className="select-none py-8">
      <p className="text-title text-muted-subtle/70">Nothing selected</p>
      <p className="mt-3 max-w-sm text-body text-muted-subtle/70">
        Select a note from the list, or create one to start writing.
      </p>
      {onCreateNote ? (
        <button
          type="button"
          onClick={onCreateNote}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors duration-fast ease-out hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          New note
        </button>
      ) : null}
    </div>
  );
}
