import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import { NoteImageView } from "@/components/editor/NoteImageView";
import { uploadNoteImage } from "@/lib/note-images-api";

export const NoteImage = Image.extend({
  name: "image",

  // Block-level so screenshots sit on their own line like Notion embeds
  inline: false,

  group: "block",

  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      uploading: {
        default: false,
        parseHTML: (element) =>
          element.getAttribute("data-uploading") === "true",
        renderHTML: (attributes) => {
          if (!attributes.uploading) return {};
          return { "data-uploading": "true" };
        },
      },
      uploadId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-upload-id"),
        renderHTML: (attributes) => {
          if (!attributes.uploadId) return {};
          return { "data-upload-id": attributes.uploadId };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(NoteImageView);
  },
});

function updateImageByUploadId(
  editor: Editor,
  uploadId: string,
  attrs: Record<string, unknown>
): boolean {
  let found = false;

  editor.state.doc.descendants((node, pos) => {
    if (found) return false;
    if (node.type.name === "image" && node.attrs.uploadId === uploadId) {
      editor
        .chain()
        .command(({ tr }) => {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            ...attrs,
          });
          return true;
        })
        .run();
      found = true;
      return false;
    }
    return true;
  });

  return found;
}

function removeImageByUploadId(editor: Editor, uploadId: string): void {
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "image" && node.attrs.uploadId === uploadId) {
      editor
        .chain()
        .command(({ tr }) => {
          tr.delete(pos, pos + node.nodeSize);
          return true;
        })
        .run();
      return false;
    }
    return true;
  });
}

/** Insert a placeholder image, upload, then swap in the public URL. */
export async function insertAndUploadImages(
  editor: Editor,
  noteId: string,
  files: File[]
): Promise<void> {
  if (!editor || files.length === 0) return;

  for (const file of files) {
    const uploadId = crypto.randomUUID();
    const blobUrl = URL.createObjectURL(file);

    const { selection } = editor.state;
    let chain = editor.chain().focus();

    if (selection instanceof NodeSelection) {
      chain = chain.setTextSelection(selection.to);
    }

    chain
      .insertContent([
        {
          type: "image",
          attrs: {
            src: blobUrl,
            alt: file.name.replace(/\.[^.]+$/, "") || "Image",
            uploading: true,
            uploadId,
          },
        },
        { type: "paragraph" },
      ])
      .run();

    try {
      const { publicUrl } = await uploadNoteImage(noteId, file);
      updateImageByUploadId(editor, uploadId, {
        src: publicUrl,
        uploading: false,
        uploadId: null,
      });
      // Delay revoke so the node view can swap to the public URL first
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
    } catch (err) {
      console.error("Image upload failed", err);
      removeImageByUploadId(editor, uploadId);
      URL.revokeObjectURL(blobUrl);
      throw err;
    }
  }
}
