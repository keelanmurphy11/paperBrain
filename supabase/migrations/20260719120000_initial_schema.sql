-- paperBrain initial schema
-- Run this in the Supabase SQL Editor (or via CLI: supabase db push)

-- ---------------------------------------------------------------------------
-- notes
-- ---------------------------------------------------------------------------
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  content_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references auth.users (id) on delete cascade,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A')
    || setweight(to_tsvector('english', coalesce(content_text, '')), 'B')
  ) stored
);

create index notes_user_id_idx on public.notes (user_id);
create index notes_updated_at_idx on public.notes (updated_at desc);
create index notes_search_vector_idx on public.notes using gin (search_vector);

-- ---------------------------------------------------------------------------
-- sources (URLs attached to a note)
-- ---------------------------------------------------------------------------
create table public.sources (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes (id) on delete cascade,
  url text not null,
  title text,
  created_at timestamptz not null default now()
);

create index sources_note_id_idx on public.sources (note_id);

-- ---------------------------------------------------------------------------
-- tags
-- ---------------------------------------------------------------------------
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  unique (user_id, name)
);

create index tags_user_id_idx on public.tags (user_id);

-- ---------------------------------------------------------------------------
-- note_tags (junction)
-- ---------------------------------------------------------------------------
create table public.note_tags (
  note_id uuid not null references public.notes (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (note_id, tag_id)
);

create index note_tags_tag_id_idx on public.note_tags (tag_id);

-- ---------------------------------------------------------------------------
-- note_links (backlinks between notes)
-- ---------------------------------------------------------------------------
create table public.note_links (
  id uuid primary key default gen_random_uuid(),
  source_note_id uuid not null references public.notes (id) on delete cascade,
  target_note_id uuid not null references public.notes (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint note_links_no_self_link check (source_note_id <> target_note_id),
  unique (source_note_id, target_note_id)
);

create index note_links_source_note_id_idx on public.note_links (source_note_id);
create index note_links_target_note_id_idx on public.note_links (target_note_id);

-- ---------------------------------------------------------------------------
-- updated_at auto-update on notes
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger notes_set_updated_at
  before update on public.notes
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.notes enable row level security;
alter table public.sources enable row level security;
alter table public.tags enable row level security;
alter table public.note_tags enable row level security;
alter table public.note_links enable row level security;

-- notes: owner-only
create policy "notes_select_own"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "notes_insert_own"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "notes_update_own"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notes_delete_own"
  on public.notes for delete
  using (auth.uid() = user_id);

-- sources: via parent note ownership
create policy "sources_select_own"
  on public.sources for select
  using (
    exists (
      select 1 from public.notes
      where notes.id = sources.note_id
        and notes.user_id = auth.uid()
    )
  );

create policy "sources_insert_own"
  on public.sources for insert
  with check (
    exists (
      select 1 from public.notes
      where notes.id = sources.note_id
        and notes.user_id = auth.uid()
    )
  );

create policy "sources_update_own"
  on public.sources for update
  using (
    exists (
      select 1 from public.notes
      where notes.id = sources.note_id
        and notes.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.notes
      where notes.id = sources.note_id
        and notes.user_id = auth.uid()
    )
  );

create policy "sources_delete_own"
  on public.sources for delete
  using (
    exists (
      select 1 from public.notes
      where notes.id = sources.note_id
        and notes.user_id = auth.uid()
    )
  );

-- tags: owner-only
create policy "tags_select_own"
  on public.tags for select
  using (auth.uid() = user_id);

create policy "tags_insert_own"
  on public.tags for insert
  with check (auth.uid() = user_id);

create policy "tags_update_own"
  on public.tags for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tags_delete_own"
  on public.tags for delete
  using (auth.uid() = user_id);

-- note_tags: both note and tag must belong to the user
create policy "note_tags_select_own"
  on public.note_tags for select
  using (
    exists (
      select 1 from public.notes
      where notes.id = note_tags.note_id
        and notes.user_id = auth.uid()
    )
  );

create policy "note_tags_insert_own"
  on public.note_tags for insert
  with check (
    exists (
      select 1 from public.notes
      where notes.id = note_tags.note_id
        and notes.user_id = auth.uid()
    )
    and exists (
      select 1 from public.tags
      where tags.id = note_tags.tag_id
        and tags.user_id = auth.uid()
    )
  );

create policy "note_tags_delete_own"
  on public.note_tags for delete
  using (
    exists (
      select 1 from public.notes
      where notes.id = note_tags.note_id
        and notes.user_id = auth.uid()
    )
  );

-- note_links: both notes must belong to the user
create policy "note_links_select_own"
  on public.note_links for select
  using (
    exists (
      select 1 from public.notes
      where notes.id = note_links.source_note_id
        and notes.user_id = auth.uid()
    )
  );

create policy "note_links_insert_own"
  on public.note_links for insert
  with check (
    exists (
      select 1 from public.notes as source
      where source.id = note_links.source_note_id
        and source.user_id = auth.uid()
    )
    and exists (
      select 1 from public.notes as target
      where target.id = note_links.target_note_id
        and target.user_id = auth.uid()
    )
  );

create policy "note_links_delete_own"
  on public.note_links for delete
  using (
    exists (
      select 1 from public.notes
      where notes.id = note_links.source_note_id
        and notes.user_id = auth.uid()
    )
  );
