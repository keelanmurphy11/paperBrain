/** App Router path helpers and imperative navigation for non-React call sites. */

export function notePath(noteId: string): string {
  return `/note/${noteId}`;
}

export function folderPath(folderId: string): string {
  return `/folder/${folderId}`;
}

export const HOME_PATH = "/";
export const SEARCH_PATH = "/search";

/** Destination for a search result's folder chip / scoped-folder navigation. */
export function searchFolderDestination(folderId: string): string {
  return folderPath(folderId);
}

export function notePathWithFocus(noteId: string): string {
  return `${notePath(noteId)}?focus=title`;
}

type NavigateFn = (href: string) => void;

let navigateFn: NavigateFn | null = null;

/** Registered by the app shell so TipTap plugins can navigate without hooks. */
export function registerAppNavigate(fn: NavigateFn | null) {
  navigateFn = fn;
}

export function navigateTo(href: string) {
  if (navigateFn) {
    navigateFn(href);
    return;
  }
  if (typeof window !== "undefined") {
    window.location.assign(href);
  }
}

export function navigateToNote(
  noteId: string,
  options?: { focusTitle?: boolean }
) {
  navigateTo(
    options?.focusTitle ? notePathWithFocus(noteId) : notePath(noteId)
  );
}

export function parseNoteIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/note\/([^/]+)/);
  return match?.[1] ?? null;
}

export function parseFolderIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/folder\/([^/]+)/);
  return match?.[1] ?? null;
}
