import { createClient } from "@/lib/supabase/client";
import type { FolderId } from "@/types";

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
  folder_id: FolderId | null;
  folder_name: string | null;
  folder_path: string | null;
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
  folder_id: string | null;
  folder_name: string | null;
  folder_path: string | null;
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

export type SearchNotesOptions = {
  limit?: number;
  folderId?: FolderId | null;
};

export async function searchNotes(
  query: string,
  options: SearchNotesOptions = {}
): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const supabase = createClient();
  const { data, error } = await supabase.rpc("search_notes", {
    search_query: trimmed,
    result_limit: options.limit ?? 25,
    folder_filter: options.folderId ?? null,
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
    folder_id: row.folder_id,
    folder_name: row.folder_name,
    folder_path: row.folder_path,
  }));
}
