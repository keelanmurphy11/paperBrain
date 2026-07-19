import { fetchNotes } from "@/lib/notes-api";
import { fetchSourcesForNote } from "@/lib/sources-api";
import { fetchTagsForNote } from "@/lib/tags-api";
import { fetchFolders } from "@/lib/folders-api";
import { tiptapToMarkdown } from "@/lib/tiptap-to-markdown";
import type { Folder, Note, Source, Tag } from "@/types";
import JSZip from "jszip";

function getFolderPath(
  folders: Folder[],
  folderId: string | null | undefined
): string {
  if (!folderId) return "Unfiled";
  const folder = folders.find((f) => f.id === folderId);
  if (!folder) return "Unfiled";
  if (!folder.parent_id) return folder.name;
  const parent = folders.find((f) => f.id === folder.parent_id);
  return parent ? `${parent.name} / ${folder.name}` : folder.name;
}

function getRootFolders(folders: Folder[]): Folder[] {
  return folders
    .filter((f) => f.parent_id === null)
    .sort((a, b) => {
      if (a.is_inbox !== b.is_inbox) return a.is_inbox ? -1 : 1;
      if (a.position !== b.position) return a.position - b.position;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
}

function getChildFolders(folders: Folder[], parentId: string): Folder[] {
  return folders
    .filter((f) => f.parent_id === parentId)
    .sort((a, b) => {
      if (a.position !== b.position) return a.position - b.position;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
}
export type NoteExportContext = {
  note: Note;
  tags: Tag[];
  sources: Source[];
  folderPath: string;
};

function yamlEscape(value: string): string {
  if (/[:#{}[\],&*?|>!%@`]/.test(value) || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return value;
}

function buildFrontmatter(ctx: NoteExportContext): string {
  const lines: string[] = ["---"];
  const title = ctx.note.title.trim() || "Untitled";
  lines.push(`title: ${yamlEscape(title)}`);
  lines.push(`folder: ${yamlEscape(ctx.folderPath)}`);

  if (ctx.tags.length > 0) {
    lines.push("tags:");
    for (const tag of ctx.tags) {
      lines.push(`  - ${yamlEscape(tag.name)}`);
    }
  } else {
    lines.push("tags: []");
  }

  if (ctx.sources.length > 0) {
    lines.push("sources:");
    for (const source of ctx.sources) {
      lines.push(`  - title: ${yamlEscape(source.title?.trim() || source.url)}`);
      lines.push(`    url: ${yamlEscape(source.url)}`);
    }
  } else {
    lines.push("sources: []");
  }

  lines.push(`created_at: ${ctx.note.created_at}`);
  lines.push(`updated_at: ${ctx.note.updated_at}`);
  lines.push(`id: ${ctx.note.id}`);
  lines.push("---");
  return lines.join("\n");
}

/** Full markdown document: YAML frontmatter + body. */
export function noteToMarkdown(ctx: NoteExportContext): string {
  const frontmatter = buildFrontmatter(ctx);
  const body = tiptapToMarkdown(ctx.note.content);
  const heading = `# ${ctx.note.title.trim() || "Untitled"}\n\n`;
  return `${frontmatter}\n\n${heading}${body}`.trimEnd() + "\n";
}

export function sanitizeFilename(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .slice(0, 80);
  return cleaned || "untitled";
}

export function sanitizeFolderSegment(name: string): string {
  return sanitizeFilename(name);
}

function folderDirPath(folders: Folder[], folderId: string | null): string {
  if (!folderId) return "_unfiled";
  const folder = folders.find((f) => f.id === folderId);
  if (!folder) return "_unfiled";
  if (folder.parent_id) {
    const parent = folders.find((f) => f.id === folder.parent_id);
    if (parent) {
      return `${sanitizeFolderSegment(parent.name)}/${sanitizeFolderSegment(folder.name)}`;
    }
  }
  return sanitizeFolderSegment(folder.name);
}

export function downloadTextFile(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function buildNoteExportContext(
  note: Note,
  folders: Folder[]
): Promise<NoteExportContext> {
  const [tags, sources] = await Promise.all([
    fetchTagsForNote(note.id),
    fetchSourcesForNote(note.id),
  ]);

  return {
    note,
    tags,
    sources,
    folderPath: getFolderPath(folders, note.folder_id),
  };
}

/** Export one note as a downloadable .md file. */
export async function exportSingleNote(
  note: Note,
  folders: Folder[]
): Promise<void> {
  const ctx = await buildNoteExportContext(note, folders);
  const markdown = noteToMarkdown(ctx);
  const filename = `${sanitizeFilename(note.title || "untitled")}.md`;
  downloadTextFile(filename, markdown);
}

/** Export all notes as a zip mirroring the folder tree. */
export async function exportAllNotesAsZip(): Promise<void> {
  const [notes, folders] = await Promise.all([fetchNotes(), fetchFolders()]);
  const zip = new JSZip();

  // Ensure empty folders still appear in the archive
  for (const root of getRootFolders(folders)) {
    zip.folder(sanitizeFolderSegment(root.name));
    for (const child of getChildFolders(folders, root.id)) {
      zip.folder(
        `${sanitizeFolderSegment(root.name)}/${sanitizeFolderSegment(child.name)}`
      );
    }
  }
  zip.folder("_unfiled");

  const usedPaths = new Set<string>();

  for (const note of notes) {
    const ctx = await buildNoteExportContext(note, folders);
    const markdown = noteToMarkdown(ctx);
    const dir = folderDirPath(folders, note.folder_id);
    const base = sanitizeFilename(note.title || "untitled");
    let path = `${dir}/${base}.md`;
    let n = 2;
    while (usedPaths.has(path.toLowerCase())) {
      path = `${dir}/${base}-${n}.md`;
      n += 1;
    }
    usedPaths.add(path.toLowerCase());
    zip.file(path, markdown);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(`paperbrain-export-${stamp}.zip`, blob);
}
