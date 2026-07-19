import { createClient } from "@/lib/supabase/client";

export type SearchMatchedVia = "title" | "content" | "tag" | "source";

export type SearchResultSource = {
  id: string;
  title: string | null;
  url: string;
  matched: boolean;
};

export type SearchResultTag = {
  id: string;
  name: string;
  matched: boolean;
};

export type SearchResult = {
  note_id: string;
  title: string;
  updated_at: string;
  rank: number;
  snippet: string;
  matched_via: SearchMatchedVia[];
  sources: SearchResultSource[];
  tags: SearchResultTag[];
};

type SearchNotesRow = {
  note_id: string;
  title: string;
  updated_at: string;
  rank: number;
  snippet: string;
  matched_via: string[] | null;
  sources: SearchResultSource[] | null;
  tags: SearchResultTag[] | null;
};

function normalizeVia(via: string[] | null): SearchMatchedVia[] {
  if (!via) return [];
  const allowed = new Set<SearchMatchedVia>([
    "title",
    "content",
    "tag",
    "source",
  ]);
  return via.filter((v): v is SearchMatchedVia =>
    allowed.has(v as SearchMatchedVia)
  );
}

export async function searchNotes(
  query: string,
  limit = 25
): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const supabase = createClient();
  const { data, error } = await supabase.rpc("search_notes", {
    search_query: trimmed,
    result_limit: limit,
  });

  if (error) throw error;

  return ((data ?? []) as SearchNotesRow[]).map((row) => ({
    note_id: row.note_id,
    title: row.title ?? "",
    updated_at: row.updated_at,
    rank: row.rank ?? 0,
    snippet: row.snippet ?? "",
    matched_via: normalizeVia(row.matched_via),
    sources: Array.isArray(row.sources) ? row.sources : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
  }));
}
