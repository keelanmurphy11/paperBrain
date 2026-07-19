/**
 * Quick smoke test for TipTap → Markdown conversion.
 * Run: npx tsx scripts/test-markdown-export.ts
 */
import { noteToMarkdown } from "../src/lib/export-notes";
import { tiptapToMarkdown } from "../src/lib/tiptap-to-markdown";
import type { Note, TipTapDoc } from "../src/types";

const sampleDoc: TipTapDoc = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Claim" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Creatine " },
        { type: "text", marks: [{ type: "bold" }], text: "improves" },
        { type: "text", text: " power output." },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Details" }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "ATP regeneration" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  marks: [{ type: "italic" }],
                  text: "Water retention",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Evidence is strong in trained athletes." }],
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          marks: [
            {
              type: "link",
              attrs: { href: "https://example.com/review" },
            },
          ],
          text: "Meta-analysis",
        },
      ],
    },
    {
      type: "image",
      attrs: {
        src: "https://cdn.example.com/chart.webp",
        alt: "Power chart",
      },
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          marks: [
            { type: "noteLink", attrs: { noteId: "abc", title: "Related note" } },
          ],
          text: "Related note",
        },
      ],
    },
    {
      type: "sourceBlock",
      attrs: {
        sourceId: "s1",
        url: "https://pubmed.example/1",
        title: "PubMed study",
      },
    },
  ],
};

const body = tiptapToMarkdown(sampleDoc);
console.log("--- BODY ---\n");
console.log(body);

const checks: Array<[string, boolean]> = [
  ["h2 Claim", body.includes("## Claim")],
  ["bold", body.includes("**improves**")],
  ["bullet list", body.includes("- ATP regeneration")],
  ["italic in list", body.includes("*Water retention*")],
  ["blockquote", body.includes("> Evidence is strong")],
  ["link", body.includes("[Meta-analysis](https://example.com/review)")],
  ["image", body.includes("![Power chart](https://cdn.example.com/chart.webp)")],
  ["wiki link", body.includes("[[Related note]]")],
  ["no source block body", !body.includes("PubMed")],
];

const note: Note = {
  id: "11111111-1111-1111-1111-111111111111",
  title: "Creatine & power",
  content: sampleDoc,
  content_text: "…",
  created_at: "2026-07-19T12:00:00.000Z",
  updated_at: "2026-07-19T12:30:00.000Z",
  user_id: "u1",
  folder_id: null,
  template_type: "fact",
};

const full = noteToMarkdown({
  note,
  tags: [
    { id: "t1", name: "supplements", user_id: "u1" },
    { id: "t2", name: "training", user_id: "u1" },
  ],
  sources: [
    {
      id: "s1",
      note_id: note.id,
      url: "https://pubmed.example/1",
      title: "PubMed study",
      created_at: "2026-07-19T12:00:00.000Z",
    },
  ],
  folderPath: "Training / Nutrition",
});

console.log("\n--- FULL DOCUMENT ---\n");
console.log(full);

checks.push(
  ["frontmatter title", full.includes('title: "Creatine & power"') || full.includes("title: Creatine")],
  ["frontmatter folder", full.includes("Training / Nutrition")],
  ["frontmatter tags", full.includes("supplements") && full.includes("training")],
  ["frontmatter sources", full.includes("https://pubmed.example/1")],
  ["frontmatter template", full.includes("template: fact")],
  ["h1 title", full.includes("# Creatine & power")]
);

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failed += 1;
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log("\nAll markdown export checks passed.");
