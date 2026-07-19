import type { Note } from "@/types";

/** Rank notes by fuzzy title match. Higher is better; 0 = no match. */
export function scoreNoteTitle(query: string, title: string): number {
  const q = query.trim().toLowerCase();
  const t = (title.trim() || "untitled").toLowerCase();

  if (!q) return 1;

  if (t === q) return 100;
  if (t.startsWith(q)) return 80 + Math.min(19, q.length);
  if (t.includes(q)) return 50 + Math.min(19, q.length);

  // Subsequence match (e.g. "z2" → "zone 2")
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  if (qi === q.length) {
    return 20 + Math.min(19, q.length);
  }

  // Token-prefix match
  const tokens = t.split(/[\s\-_]+/);
  if (tokens.some((token) => token.startsWith(q))) {
    return 40 + Math.min(19, q.length);
  }

  return 0;
}

export function fuzzyMatchNotes(
  notes: Note[],
  query: string,
  options?: { excludeId?: string; limit?: number }
): Note[] {
  const excludeId = options?.excludeId;
  const limit = options?.limit ?? 8;

  return notes
    .filter((n) => n.id !== excludeId)
    .map((note) => ({
      note,
      score: scoreNoteTitle(query, note.title),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const at = a.note.title.trim() || "Untitled";
      const bt = b.note.title.trim() || "Untitled";
      return at.localeCompare(bt, undefined, { sensitivity: "base" });
    })
    .slice(0, limit)
    .map((row) => row.note);
}

export function noteDisplayTitle(title: string): string {
  const trimmed = title.trim();
  return trimmed || "Untitled";
}
