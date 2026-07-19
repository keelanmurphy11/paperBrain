import { EMPTY_DOC } from "@/lib/notes";
import type { TipTapDoc } from "@/types";

/** Stored on notes.template_type — null means blank/freeform. */
export type NoteTemplateType = "fact";

export type NoteTemplateId = "blank" | NoteTemplateType;

export type NoteTemplateOption = {
  id: NoteTemplateId;
  label: string;
  description: string;
  /** Value persisted on the note; null for blank. */
  templateType: NoteTemplateType | null;
};

export const NOTE_TEMPLATES: NoteTemplateOption[] = [
  {
    id: "blank",
    label: "Blank note",
    description: "Empty page — write freely",
    templateType: null,
  },
  {
    id: "fact",
    label: "Fact note",
    description: "Claim, details, and confidence",
    templateType: "fact",
  },
];

function heading(level: 1 | 2, text: string) {
  return {
    type: "heading" as const,
    attrs: { level },
    content: [{ type: "text" as const, text }],
  };
}

function emptyParagraph() {
  return { type: "paragraph" as const };
}

/** Editable TipTap scaffold for Fact notes — not a locked form. */
export function buildFactNoteDoc(): TipTapDoc {
  return {
    type: "doc",
    content: [
      heading(2, "Claim"),
      emptyParagraph(),
      heading(2, "Details"),
      emptyParagraph(),
      heading(2, "Confidence"),
      emptyParagraph(),
    ],
  };
}

export function factNoteContentText(): string {
  return "Claim\n\nDetails\n\nConfidence\n";
}

export function getTemplateContent(templateId: NoteTemplateId): {
  content: TipTapDoc;
  content_text: string;
  template_type: NoteTemplateType | null;
} {
  if (templateId === "fact") {
    return {
      content: buildFactNoteDoc(),
      content_text: factNoteContentText(),
      template_type: "fact",
    };
  }

  return {
    content: EMPTY_DOC,
    content_text: "",
    template_type: null,
  };
}
