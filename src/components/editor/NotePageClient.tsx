"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { NoteEditor } from "@/components/editor/NoteEditor";
import { NoteEditorSkeleton } from "@/components/ui/Skeletons";
import { useAppNav } from "@/hooks/use-app-nav";
import { useCreateNote, useNotes } from "@/hooks/use-notes";
import { folderPath, HOME_PATH } from "@/lib/navigation";
import { toast } from "@/store/toast";
import { useUiStore } from "@/store/ui";

type NotePageClientProps = {
  noteId: string;
};

export function NotePageClient({ noteId }: NotePageClientProps) {
  return (
    <Suspense fallback={<NoteEditorSkeleton className="w-full" />}>
      <NotePageInner noteId={noteId} />
    </Suspense>
  );
}

function NotePageInner({ noteId }: NotePageClientProps) {
  const { data: notes = [], isLoading, isError, error, isFetched } = useNotes();
  const createNote = useCreateNote();
  const searchParams = useSearchParams();
  const { goBack, openNote, router } = useAppNav();
  const setFocusTitleOnOpen = useUiStore((s) => s.setFocusTitleOnOpen);
  const lastFolderId = useUiStore((s) => s.lastFolderId);
  const setLastFolderId = useUiStore((s) => s.setLastFolderId);
  const setMobileHomePane = useUiStore((s) => s.setMobileHomePane);

  const note = notes.find((n) => n.id === noteId) ?? null;
  const noteMissing = isFetched && !isLoading && !isError && !note;

  useEffect(() => {
    if (note?.folder_id) setLastFolderId(note.folder_id);
  }, [note?.folder_id, setLastFolderId]);

  useEffect(() => {
    if (searchParams.get("focus") === "title") {
      setFocusTitleOnOpen(true);
    }
  }, [searchParams, setFocusTitleOnOpen]);

  useEffect(() => {
    if (!isError) return;
    toast(
      error instanceof Error ? error.message : "Couldn’t load notes",
      "error"
    );
  }, [isError, error]);

  useEffect(() => {
    if (!noteMissing) return;
    const fallback = lastFolderId ? folderPath(lastFolderId) : HOME_PATH;
    router.replace(fallback);
  }, [noteMissing, lastFolderId, router]);

  async function handleCreateNote() {
    try {
      const created = await createNote.mutateAsync({
        folderId: lastFolderId ?? undefined,
      });
      openNote(created.id, { focusTitle: true });
    } catch (err) {
      console.error("Failed to create note", err);
      toast("Couldn’t create note. Try again.", "error");
    }
  }

  function handleBack() {
    // Prefer true history so All Notes → Note → Back returns to All Notes
    const fallback = note?.folder_id
      ? folderPath(note.folder_id)
      : HOME_PATH;
    if (!note?.folder_id) {
      setMobileHomePane("folders");
    }
    goBack(fallback);
  }

  // Keep skeleton while loading or while redirecting a missing note — no empty flash
  if ((isLoading && !note) || noteMissing) {
    return <NoteEditorSkeleton className="w-full" />;
  }

  return (
    <NoteEditor
      note={note}
      showBack
      onBack={handleBack}
      className="w-full"
      onCreateNote={() => void handleCreateNote()}
    />
  );
}
