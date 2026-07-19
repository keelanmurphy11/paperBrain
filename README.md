# paperBrain

A personal notes app for capturing research, linking ideas with `[[wiki links]]`, tagging, and finding everything fast via full-text search.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind
- **Supabase** (Auth, Postgres, RLS)
- **TipTap** editor
- **TanStack Query** + Zustand
- **PWA** (installable on iPhone / desktop)

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- (Optional) [Supabase CLI](https://supabase.com/docs/guides/cli) for applying migrations

## Environment variables

Copy the example file and fill in values from your Supabase project (**Settings → API**):

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon / public API key |
| `SUPABASE_ACCESS_TOKEN` | No | Personal access token for CLI (`supabase db push`) |

## Database setup

Migrations live in `supabase/migrations/`:

1. `20260719120000_initial_schema.sql` — notes, sources, tags, note_links, RLS
2. `20260719140000_search_notes.sql` — `search_notes` RPC for ranked search
3. `20260719160000_folders.sql` — folders (Inbox + one-level nesting), `notes.folder_id`
4. `20260719170000_search_notes_folders.sql` — search results include folder path + optional folder filter
5. `20260719180000_note_images_storage.sql` — `note-images` Storage bucket + owner-scoped RLS
6. `20260719190000_note_template_type.sql` — added `notes.template_type` (later removed)
7. `20260719200000_drop_note_template_type.sql` — drops `notes.template_type`

### Option A — Supabase CLI (recommended)

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

### Option B — SQL Editor

In the Supabase dashboard, open **SQL Editor** and run each migration file in order (oldest first).

After migrations, create an Auth user (Email/Password) under **Authentication → Users** so you can sign in.

## Run locally

```bash
npm install
npm run icons   # regenerate PWA icons from public/icon.svg (optional)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, and start writing.

### Useful scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run icons` | Generate PWA PNGs from `public/icon.svg` |
| `npm run lint` | ESLint |

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Open / close search |
| `⌘N` / `Ctrl+N` | New note |
| `Escape` | Close search / dismiss dialogs |
| `[[` in the editor | Insert a wiki-link to another note |

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add the same env vars as `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Deploy.

Ensure Supabase Auth **Site URL** and **Redirect URLs** include your Vercel domain (e.g. `https://your-app.vercel.app`).

For PWA installability, use HTTPS (Vercel provides this). After deploy, Chrome should show an install icon; on iPhone Safari use **Share → Add to Home Screen**.

## Project structure (high level)

```
src/
  app/                 # routes, layout, offline page, manifest
  components/
    editor/            # TipTap note editor, tags, sources, backlinks
    layout/            # shell, sidebar, note list, settings/export
    search/            # Cmd+K palette
    pwa/               # service worker registration
  hooks/               # React Query hooks
  lib/                 # Supabase clients, APIs
  store/               # UI + toast state
supabase/migrations/   # Postgres schema + search RPC
public/                # icons, service worker
```

## Notes on offline

The service worker caches the app shell so brief connectivity drops don’t show a blank screen. Offline note editing and sync are intentionally out of scope for now.
