-- =============================================================================
-- Migration: 20240101000010_create_storage_bucket
-- Description: Creates the "avatars" storage bucket and attaches storage
--              policies so each authenticated user can only read/write files
--              inside their own folder (avatars/{user_id}/*).
--
-- Bucket is NOT public so avatar URLs require a signed URL or the app must
-- use the authenticated Supabase client to generate temporary URLs.
-- Max file size (2 MB) and allowed MIME types are enforced in application
-- code (Zod + server-side validation); storage policies do path isolation only.
-- =============================================================================

-- Create the bucket if it does not already exist (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  false,                                          -- private: no direct public URL
  2097152,                                        -- 2 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Storage RLS Policies
-- Path convention: avatars/{user_id}/avatar.{ext}
-- ---------------------------------------------------------------------------

-- SELECT: an authenticated user may download files only from their own folder
DROP POLICY IF EXISTS "avatars_select_own" ON storage.objects;
CREATE POLICY "avatars_select_own"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- INSERT: a user may upload into their own folder only
DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
CREATE POLICY "avatars_insert_own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- UPDATE: a user may replace their own avatar
DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- DELETE: a user may remove their own avatar;
-- managers may remove any avatar (e.g. policy violation)
DROP POLICY IF EXISTS "avatars_delete_own_or_manager" ON storage.objects;
CREATE POLICY "avatars_delete_own_or_manager"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR (SELECT public.is_manager())
    )
  );
