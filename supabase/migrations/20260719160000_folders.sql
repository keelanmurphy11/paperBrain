-- Folders for broad organizational sorting (one level of nesting).
-- Inbox is seeded per user and cannot be deleted or renamed.

-- ---------------------------------------------------------------------------
-- folders
-- ---------------------------------------------------------------------------
create table public.folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references public.folders (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  position int not null default 0,
  is_inbox boolean not null default false,
  created_at timestamptz not null default now(),
  constraint folders_name_not_blank check (length(trim(name)) > 0)
);

create index folders_user_id_idx on public.folders (user_id);
create index folders_parent_id_idx on public.folders (parent_id);
create index folders_user_position_idx on public.folders (user_id, position);

-- Exactly one Inbox per user
create unique index folders_one_inbox_per_user
  on public.folders (user_id)
  where is_inbox;

-- Root folder names unique per user (case-insensitive)
create unique index folders_root_name_unique
  on public.folders (user_id, lower(name))
  where parent_id is null;

-- Sibling names unique within a parent
create unique index folders_child_name_unique
  on public.folders (user_id, parent_id, lower(name))
  where parent_id is not null;

-- ---------------------------------------------------------------------------
-- notes.folder_id
-- ---------------------------------------------------------------------------
alter table public.notes
  add column folder_id uuid references public.folders (id) on delete set null;

create index notes_folder_id_idx on public.notes (folder_id);

-- ---------------------------------------------------------------------------
-- Enforce one level of nesting only
-- ---------------------------------------------------------------------------
create or replace function public.enforce_folder_depth()
returns trigger
language plpgsql
as $$
begin
  if new.parent_id is not null then
    if not exists (
      select 1
      from public.folders
      where id = new.parent_id
        and user_id = new.user_id
        and parent_id is null
    ) then
      raise exception 'Folders can only nest one level deep';
    end if;

    if exists (
      select 1 from public.folders where parent_id = new.id
    ) then
      raise exception 'Cannot nest a folder that has subfolders';
    end if;

    if new.is_inbox then
      raise exception 'Inbox cannot be a subfolder';
    end if;
  end if;

  return new;
end;
$$;

create trigger folders_enforce_depth
  before insert or update of parent_id, user_id, is_inbox
  on public.folders
  for each row
  execute function public.enforce_folder_depth();

-- ---------------------------------------------------------------------------
-- Protect Inbox: cannot delete or rename; cannot unset is_inbox
-- ---------------------------------------------------------------------------
create or replace function public.protect_inbox_folder()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    if old.is_inbox then
      raise exception 'Inbox folder cannot be deleted';
    end if;
    return old;
  end if;

  if old.is_inbox then
    if new.is_inbox is distinct from true then
      raise exception 'Inbox flag cannot be cleared';
    end if;
    if new.name is distinct from old.name then
      raise exception 'Inbox folder cannot be renamed';
    end if;
    if new.parent_id is distinct from old.parent_id then
      raise exception 'Inbox folder cannot be moved';
    end if;
  end if;

  return new;
end;
$$;

create trigger folders_protect_inbox
  before update or delete
  on public.folders
  for each row
  execute function public.protect_inbox_folder();

-- ---------------------------------------------------------------------------
-- Seed Inbox on auth user creation
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user_inbox()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.folders (name, user_id, position, is_inbox)
  values ('Inbox', new.id, 0, true)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_inbox on auth.users;

create trigger on_auth_user_created_inbox
  after insert on auth.users
  for each row
  execute function public.handle_new_user_inbox();

-- Backfill Inbox for existing users and assign orphan notes
insert into public.folders (name, user_id, position, is_inbox)
select 'Inbox', u.id, 0, true
from auth.users u
where not exists (
  select 1 from public.folders f
  where f.user_id = u.id and f.is_inbox
);

update public.notes n
set folder_id = f.id
from public.folders f
where f.user_id = n.user_id
  and f.is_inbox
  and n.folder_id is null;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.folders enable row level security;

create policy "folders_select_own"
  on public.folders for select
  using (auth.uid() = user_id);

create policy "folders_insert_own"
  on public.folders for insert
  with check (auth.uid() = user_id);

create policy "folders_update_own"
  on public.folders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "folders_delete_own"
  on public.folders for delete
  using (auth.uid() = user_id and is_inbox = false);
