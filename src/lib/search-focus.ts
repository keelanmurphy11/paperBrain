/** Imperative focus bridge so ⌘K can focus the persistent search bar. */

type FocusHandler = (options?: { scopeFolderId?: string | null }) => void;

const handlers = new Set<FocusHandler>();

export function registerSearchFocus(handler: FocusHandler) {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export function requestSearchFocus(options?: {
  scopeFolderId?: string | null;
}) {
  Array.from(handlers).forEach((handler) => {
    handler(options);
  });
}
