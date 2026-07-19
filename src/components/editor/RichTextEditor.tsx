"use client";

import type { Editor, JSONContent } from "@tiptap/react";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useRef } from "react";
import { EditorBubbleMenu } from "@/components/editor/EditorBubbleMenu";
import { WikiLinkMenu } from "@/components/editor/WikiLinkMenu";
import {
  insertAndUploadImages,
  NoteImage,
} from "@/components/editor/extensions/note-image";
import {
  collectSourceIdsFromDoc,
  SourceBlock,
} from "@/components/editor/extensions/source-block";
import { NoteLink } from "@/components/editor/extensions/note-link";
import { imageFilesFromDataTransfer } from "@/lib/note-images-api";
import { deleteSource } from "@/lib/sources-api";
import { sourcesQueryKey } from "@/hooks/use-sources";
import { EMPTY_DOC, isTipTapDoc } from "@/lib/notes";
import { toast } from "@/store/toast";
import type { Source, TipTapDoc } from "@/types";
import { useQueryClient } from "@tanstack/react-query";

type RichTextEditorProps = {
  noteId: string;
  content: TipTapDoc | unknown;
  sources: Source[];
  sourcesReady?: boolean;
  editable?: boolean;
  onUpdate: (content: TipTapDoc, plainText: string) => void;
  onReady?: (editor: Editor) => void;
  /** Expose upload helper to parent insert-image button */
  onUploadReady?: (upload: (files: File[]) => Promise<void>) => void;
};

export function RichTextEditor({
  noteId,
  content,
  sources,
  sourcesReady = true,
  editable = true,
  onUpdate,
  onReady,
  onUploadReady,
}: RichTextEditorProps) {
  const queryClient = useQueryClient();
  const onUpdateRef = useRef(onUpdate);
  const onReadyRef = useRef(onReady);
  const noteIdRef = useRef(noteId);
  const prevSourceIdsRef = useRef<Set<string>>(new Set());
  const hydratedRef = useRef(false);
  const uploadingRef = useRef(false);
  const editorInstanceRef = useRef<Editor | null>(null);

  onUpdateRef.current = onUpdate;
  onReadyRef.current = onReady;
  noteIdRef.current = noteId;

  const uploadImages = useCallback(async (files: File[]) => {
    const current = editorInstanceRef.current;
    if (!current || !current.isEditable || files.length === 0) return;
    if (uploadingRef.current) return;

    uploadingRef.current = true;
    try {
      await insertAndUploadImages(current, noteIdRef.current, files);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Couldn’t upload image",
        "error"
      );
      throw err;
    } finally {
      uploadingRef.current = false;
    }
  }, []);

  const uploadImagesRef = useRef(uploadImages);
  uploadImagesRef.current = uploadImages;

  const initialContent: JSONContent = isTipTapDoc(content)
    ? (content as JSONContent)
    : (EMPTY_DOC as JSONContent);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Link.extend({
        excludes: "noteLink",
      }).configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "note-link",
        },
      }),
      NoteLink,
      NoteImage.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: "note-image",
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing…",
      }),
      SourceBlock,
    ],
    content: initialContent,
    editable,
    editorProps: {
      attributes: {
        class: "note-editor ProseMirror focus:outline-none",
      },
      handlePaste: (_view, event) => {
        const files = imageFilesFromDataTransfer(event.clipboardData);
        if (files.length === 0) return false;
        event.preventDefault();
        void uploadImagesRef.current(files);
        return true;
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (moved) return false;
        const files = imageFilesFromDataTransfer(event.dataTransfer);
        if (files.length === 0) return false;
        event.preventDefault();
        void uploadImagesRef.current(files);
        return true;
      },
    },
    onCreate: ({ editor: current }) => {
      editorInstanceRef.current = current;
      prevSourceIdsRef.current = collectSourceIdsFromDoc(current.state.doc);
      onReadyRef.current?.(current);
    },
    onUpdate: ({ editor: current }) => {
      const currentIds = collectSourceIdsFromDoc(current.state.doc);
      const removed = Array.from(prevSourceIdsRef.current).filter(
        (id) => !currentIds.has(id)
      );
      prevSourceIdsRef.current = currentIds;

      if (removed.length > 0) {
        void Promise.all(
          removed.map(async (id) => {
            try {
              await deleteSource(id);
              queryClient.setQueryData<Source[]>(
                sourcesQueryKey(noteId),
                (prev) => (prev ?? []).filter((s) => s.id !== id)
              );
            } catch {
              // Ignore — row may already be gone
            }
          })
        );
      }

      onUpdateRef.current(
        current.getJSON() as TipTapDoc,
        current.getText({ blockSeparator: "\n" })
      );
    },
  });

  useEffect(() => {
    editorInstanceRef.current = editor;
  }, [editor]);

  useEffect(() => {
    onUploadReady?.(uploadImages);
  }, [onUploadReady, uploadImages]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor) return;
    onReadyRef.current?.(editor);
  }, [editor]);

  // Hydrate DB sources missing from the TipTap doc (one-time per mount)
  useEffect(() => {
    if (!editor || !sourcesReady || hydratedRef.current) return;

    const existing = collectSourceIdsFromDoc(editor.state.doc);
    const missing = sources.filter((s) => !existing.has(s.id));
    hydratedRef.current = true;

    if (missing.length === 0) {
      prevSourceIdsRef.current = existing;
      return;
    }

    const nodes = missing.map((s) => ({
      type: "sourceBlock",
      attrs: {
        sourceId: s.id,
        url: s.url,
        title: s.title,
      },
    }));

    editor
      .chain()
      .insertContentAt(editor.state.doc.content.size, nodes)
      .run();

    prevSourceIdsRef.current = collectSourceIdsFromDoc(editor.state.doc);
  }, [editor, sources, sourcesReady]);

  const openImagePicker = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/gif";
    input.multiple = true;
    input.onchange = () => {
      const files = input.files ? Array.from(input.files) : [];
      if (files.length) void uploadImages(files);
    };
    input.click();
  }, [uploadImages]);

  if (!editor) {
    return (
      <div className="min-h-[12rem] text-body text-muted-subtle/50">…</div>
    );
  }

  return (
    <div className="relative" data-wiki-link-root="">
      {editable ? (
        <EditorBubbleMenu editor={editor} onInsertImage={openImagePicker} />
      ) : null}
      <EditorContent editor={editor} />
      {editable ? (
        <WikiLinkMenu editor={editor} currentNoteId={noteId} />
      ) : null}
    </div>
  );
}
