import { mergeAttributes, Node } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { SourceBlockView } from "@/components/editor/SourceBlockView";

export type SourceBlockAttrs = {
  sourceId: string | null;
  url: string;
  title: string | null;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    sourceBlock: {
      insertSourceBlock: (attrs: SourceBlockAttrs) => ReturnType;
    };
  }
}

export const SourceBlock = Node.create({
  name: "sourceBlock",

  group: "block",

  atom: true,

  draggable: true,

  selectable: true,

  addAttributes() {
    return {
      sourceId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-source-id"),
        renderHTML: (attributes) => {
          if (!attributes.sourceId) return {};
          return { "data-source-id": attributes.sourceId };
        },
      },
      url: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-url") ?? "",
        renderHTML: (attributes) => ({ "data-url": attributes.url }),
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-title"),
        renderHTML: (attributes) => {
          if (!attributes.title) return {};
          return { "data-title": attributes.title };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="source-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "source-block" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SourceBlockView);
  },

  addCommands() {
    return {
      insertSourceBlock:
        (attrs) =>
        ({ chain, state }) => {
          // If an atom (e.g. previous source) is selected, insertContent would
          // replace it — move the caret after that node first.
          const { selection } = state;
          let insertChain = chain();

          if (selection instanceof NodeSelection) {
            insertChain = insertChain.setTextSelection(selection.to);
          }

          // Trailing paragraph leaves the cursor off the atom so the next
          // "Add source" appends instead of replacing.
          return insertChain
            .insertContent([
              { type: this.name, attrs },
              { type: "paragraph" },
            ])
            .run();
        },
    };
  },
});

export function collectSourceIdsFromDoc(doc: {
  descendants: (
    f: (node: {
      type: { name: string };
      attrs: Record<string, unknown>;
    }) => void
  ) => void;
}): Set<string> {
  const ids = new Set<string>();
  doc.descendants((node) => {
    if (
      node.type.name === "sourceBlock" &&
      typeof node.attrs.sourceId === "string"
    ) {
      ids.add(node.attrs.sourceId);
    }
  });
  return ids;
}
