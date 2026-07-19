-- Note images stored in Supabase Storage, path-namespaced by user_id.
-- Public read so TipTap can persist stable URLs; write/delete scoped to owner.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'note-images',
  'note-images',
  true,
  5242880, -- 5 MiB (post-compression)
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path layout: {user_id}/{note_id}/{uuid}.ext
-- First folder segment must match auth.uid()

create policy "note_images_select"
  on storage.objects for select
  to public
  using (bucket_id = 'note-images');

create policy "note_images_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'note-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "note_images_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'note-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'note-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "note_images_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'note-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
