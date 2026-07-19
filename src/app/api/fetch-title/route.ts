import {
  decodeBasicHtmlEntities,
  isSafePublicHttpUrl,
  normalizeUrl,
} from "@/lib/url";

export const runtime = "nodejs";

type FetchTitleBody = {
  url?: string;
};

function extractTitle(html: string): string | null {
  const ogMatch = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i
  ) ?? html.match(
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["'][^>]*>/i
  );

  if (ogMatch?.[1]) {
    return decodeBasicHtmlEntities(ogMatch[1]).trim() || null;
  }

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) {
    return decodeBasicHtmlEntities(titleMatch[1]).replace(/\s+/g, " ").trim() || null;
  }

  return null;
}

export async function POST(request: Request) {
  let body: FetchTitleBody;
  try {
    body = (await request.json()) as FetchTitleBody;
  } catch {
    return Response.json({ title: null, error: "Invalid JSON" }, { status: 400 });
  }

  const normalized = normalizeUrl(body.url ?? "");
  if (!normalized || !isSafePublicHttpUrl(normalized)) {
    return Response.json(
      { title: null, error: "Invalid or disallowed URL" },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(normalized, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          "paperBrain/1.0 (+https://localhost; source-title-fetch)",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return Response.json({ title: null, error: `HTTP ${response.status}` });
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (
      contentType &&
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml")
    ) {
      return Response.json({ title: null, error: "Not an HTML page" });
    }

    const buffer = await response.arrayBuffer();
    const limited = buffer.byteLength > 512_000 ? buffer.slice(0, 512_000) : buffer;
    const html = new TextDecoder("utf-8", { fatal: false }).decode(limited);
    const title = extractTitle(html);

    return Response.json({ title });
  } catch {
    return Response.json({ title: null, error: "Fetch failed" });
  }
}
