-- The RLS policies "avatars read/insert/update/delete" (see
-- 20260630232401_...sql) all filter on bucket_id = 'avatars', but no
-- migration ever actually created that bucket in storage.buckets. Every
-- avatar upload from Settings has therefore been failing at the storage
-- layer (bucket not found), even though the client code and RLS policies
-- were correct.
--
-- Bucket is created private (public = false) because the app already reads
-- avatars via signed URLs (createSignedUrl in settings.tsx), so a public
-- bucket isn't needed and keeping it private is safer.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  5242880, -- 5MB
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
