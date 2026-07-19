import type { Json, TipTapDoc } from "@/types";

type TipTapNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  content?: TipTapNode[];
};

function asNode(value: Json | undefined): TipTapNode | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as TipTapNode;
}

function escapeMdText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\*/g, "\\*")
    .replace(/_/g, "\\_")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
}

function renderInline(nodes: TipTapNode[] | undefined): string {
  if (!nodes?.length) return "";

  return nodes
    .map((node) => {
      if (node.type === "hardBreak") return "  \n";
      if (node.type === "text") {
        let text = node.text ?? "";
        const marks = node.marks ?? [];
        const hasCode = marks.some((m) => m.type === "code");
        if (hasCode) {
          text = `\`${text.replace(/`/g, "\\`")}\``;
        } else {
          text = escapeMdText(text);
        }

        for (const mark of marks) {
          if (mark.type === "code") continue;
          if (mark.type === "bold") text = `**${text}**`;
          if (mark.type === "italic") text = `*${text}*`;
          if (mark.type === "strike") text = `~~${text}~~`;
          if (mark.type === "link") {
            const href = String(mark.attrs?.href ?? "");
            text = href ? `[${text}](${href})` : text;
          }
          if (mark.type === "noteLink") {
            const title =
              (mark.attrs?.title as string | null)?.trim() ||
              text.replace(/\\/g, "") ||
              "note";
            text = `[[${title}]]`;
          }
        }
        return text;
      }

      // Nested inline containers (rare)
      if (node.content) return renderInline(node.content);
      return "";
    })
    .join("");
}

function renderListItem(item: TipTapNode, ordered: boolean, index: number, depth: number): string {
  const indent = "  ".repeat(depth);
  const bullet = ordered ? `${index}. ` : "- ";
  const children = item.content ?? [];
  const lines: string[] = [];

  let firstBlock = true;
  for (const child of children) {
    if (child.type === "paragraph") {
      const inline = renderInline(child.content);
      if (firstBlock) {
        lines.push(`${indent}${bullet}${inline}`);
        firstBlock = false;
      } else {
        lines.push(`${indent}  ${inline}`);
      }
    } else if (child.type === "bulletList" || child.type === "orderedList") {
      lines.push(renderList(child, depth + 1).trimEnd());
    } else {
      const block = renderBlock(child, depth + 1);
      if (block) lines.push(block.trimEnd());
    }
  }

  if (lines.length === 0) {
    lines.push(`${indent}${bullet}`);
  }

  return lines.join("\n");
}

function renderList(node: TipTapNode, depth = 0): string {
  const ordered = node.type === "orderedList";
  const items = node.content ?? [];
  return (
    items
      .map((item, i) => renderListItem(item, ordered, i + 1, depth))
      .join("\n") + "\n\n"
  );
}

function renderBlock(node: TipTapNode, listDepth = 0): string {
  switch (node.type) {
    case "paragraph": {
      const text = renderInline(node.content).trimEnd();
      return text ? `${text}\n\n` : "\n";
    }
    case "heading": {
      const level = Math.min(6, Math.max(1, Number(node.attrs?.level ?? 1)));
      const text = renderInline(node.content).trim();
      return `${"#".repeat(level)} ${text}\n\n`;
    }
    case "bulletList":
    case "orderedList":
      return renderList(node, listDepth);
    case "blockquote": {
      const inner = (node.content ?? [])
        .map((child) => renderBlock(child).trimEnd())
        .join("\n")
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
      return `${inner}\n\n`;
    }
    case "codeBlock": {
      const lang = String(node.attrs?.language ?? "");
      const code = (node.content ?? [])
        .map((n) => n.text ?? "")
        .join("");
      return `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
    }
    case "horizontalRule":
      return "---\n\n";
    case "image": {
      const src = String(node.attrs?.src ?? "").trim();
      if (!src || node.attrs?.uploading) return "";
      const alt = String(node.attrs?.alt ?? "image").replace(/[[\]]/g, "");
      const title = node.attrs?.title
        ? String(node.attrs.title).replace(/"/g, '\\"')
        : "";
      return title
        ? `![${alt}](${src} "${title}")\n\n`
        : `![${alt}](${src})\n\n`;
    }
    case "sourceBlock":
      // Sources are exported in YAML frontmatter — skip body duplicate
      return "";
    default:
      if (node.content) {
        return (node.content ?? []).map((c) => renderBlock(c, listDepth)).join("");
      }
      return "";
  }
}

/** Convert TipTap JSON to clean Markdown for the node types paperBrain uses. */
export function tiptapToMarkdown(doc: TipTapDoc | Json | null | undefined): string {
  const root = asNode(doc as Json);
  if (!root || root.type !== "doc") return "";

  const body = (root.content ?? [])
    .map((node) => renderBlock(node))
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return body ? `${body}\n` : "";
}
