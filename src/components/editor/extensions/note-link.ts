import { mergeAttributes, Mark } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import type { TipTapDoc } from "@/types";
import { useUiStore } from "@/store/ui";

export type NoteLinkAttrs = {
  noteId: string | null;
  title: string | null;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    noteLink: {
      setNoteLink: (attrs: NoteLinkAttrs) => ReturnType;
      unsetNoteLink: () => ReturnType;
      insertNoteLink: (attrs: {
        noteId: string;
        title: string;
        from: number;
        to: number;
      }) => ReturnType;
    };
  }
}

export const NoteLink = Mark.create({
  name: "noteLink",

  excludes: "link",

  inclusive: false,

  addAttributes() {
    return {
      noteId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-note-id"),
        renderHTML: (attributes) => {
          if (!attributes.noteId) return {};
          return { "data-note-id": attributes.noteId };
        },
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-note-title"),
        renderHTML: (attributes) => {
          if (!attributes.title) return {};
          return { "data-note-title": attributes.title };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-note-link]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-note-link": "",
        class: "note-internal-link",
        role: "link",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setNoteLink:
        (attrs) =>
        ({ commands }) =>
          commands.setMark(this.name, attrs),

      unsetNoteLink:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),

      insertNoteLink:
        ({ noteId, title, from, to }) =>
        ({ tr, dispatch, state }) => {
          if (from < 0 || to < from || to > state.doc.content.size) {
            return false;
          }

          const mark = state.schema.marks.noteLink?.create({
            noteId,
            title,
          });
          if (!mark) return false;

          tr.delete(from, to);
          const textNode = state.schema.text(title, [mark]);
          tr.insert(from, textNode);
          const pos = from + title.length;
          tr.setSelection(TextSelection.create(tr.doc, pos));

          if (dispatch) dispatch(tr.scrollIntoView());
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("noteLinkClick"),
        props: {
          handleClick: (_view, _pos, event) => {
            const target = event.target;
            if (!(target instanceof Element)) return false;

            const el = target.closest("[data-note-link]");
            if (!el) return false;

            const noteId = el.getAttribute("data-note-id");
            if (!noteId) return false;

            event.preventDefault();
            useUiStore.getState().selectNote(noteId);
            return true;
          },
        },
      }),
    ];
  },
});

type WalkNode = {
  type?: string;
  content?: unknown[];
  marks?: Array<{ type?: string; attrs?: Record<string, unknown> }>;
  attrs?: Record<string, unknown>;
};

/** Collect unique target note IDs from TipTap JSON content. */
export function collectNoteLinkIdsFromContent(doc: TipTapDoc | WalkNode): Set<string> {
  const ids = new Set<string>();

  function walk(node: WalkNode) {
    if (Array.isArray(node.marks)) {
      for (const mark of node.marks) {
        if (
          mark.type === "noteLink" &&
          typeof mark.attrs?.noteId === "string" &&
          mark.attrs.noteId
        ) {
          ids.add(mark.attrs.noteId);
        }
      }
    }

    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        walk(child as WalkNode);
      }
    }
  }

  walk(doc);
  return ids;
}
