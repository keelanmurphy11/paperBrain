"use client";

import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EditorBubbleMenuProps = {
  editor: Editor;
};

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 8 }}
      className="flex items-center gap-0.5 rounded-lg border border-border bg-surface p-1 shadow-md"
    >
      <MenuButton
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-3.5" strokeWidth={2} />
      </MenuButton>
      <MenuButton
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-3.5" strokeWidth={2} />
      </MenuButton>
      <Divider />
      <MenuButton
        label="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="size-3.5" strokeWidth={2} />
      </MenuButton>
      <MenuButton
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-3.5" strokeWidth={2} />
      </MenuButton>
      <Divider />
      <MenuButton
        label="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-3.5" strokeWidth={2} />
      </MenuButton>
      <MenuButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-3.5" strokeWidth={2} />
      </MenuButton>
      <MenuButton
        label="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-3.5" strokeWidth={2} />
      </MenuButton>
      <Divider />
      <MenuButton
        label="Link"
        active={editor.isActive("link")}
        onClick={() => {
          if (editor.isActive("link")) {
            editor.chain().focus().unsetLink().run();
            return;
          }
          const previous = editor.getAttributes("link").href as
            | string
            | undefined;
          const url = window.prompt("URL", previous ?? "https://");
          if (url === null) return;
          const trimmed = url.trim();
          if (!trimmed) {
            editor.chain().focus().unsetLink().run();
            return;
          }
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: trimmed })
            .run();
        }}
      >
        <LinkIcon className="size-3.5" strokeWidth={2} />
      </MenuButton>
    </BubbleMenu>
  );
}

function MenuButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex size-7 items-center justify-center rounded-md text-muted transition-colors duration-fast ease-out",
        "hover:bg-hover hover:text-foreground",
        active && "bg-active text-accent"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-0.5 h-4 w-px bg-border-subtle" aria-hidden />;
}
