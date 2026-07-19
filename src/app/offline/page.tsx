export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <span
        className="flex size-10 items-center justify-center rounded-lg bg-accent text-sm font-semibold tracking-tight text-white"
        aria-hidden
      >
        p
      </span>
      <h1 className="mt-5 text-lg font-medium tracking-tight text-foreground">
        You’re offline
      </h1>
      <p className="mt-2 max-w-xs text-sm text-muted">
        paperBrain can’t reach the network right now. Check your connection and
        try again.
      </p>
      <a
        href="/"
        className="mt-6 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white transition-colors duration-fast ease-out hover:bg-accent-hover"
      >
        Try again
      </a>
    </main>
  );
}
