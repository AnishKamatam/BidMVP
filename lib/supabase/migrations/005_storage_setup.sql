-- Migration 005: Storage bucket setup for profile photos and fraternity photos
-- Run this in your Supabase SQL Editor

-- ============================================
-- Create profile-photos storage bucket
-- ============================================

-- Create bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Create fraternity-photos storage bucket
-- ============================================

-- Create bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('fraternity-photos', 'fraternity-photos', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- RLS Policies for profile-photos bucket
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read profile photos" ON storage.objects;

-- Users can upload their own photos
-- Path format: {userId}/{timestamp}-{filename}
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own photos
CREATE POLICY "Users can read own photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public can read profile photos (for displaying in app)
CREATE POLICY "Public can read profile photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- ============================================
-- RLS Policies for fraternity-photos bucket
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can upload fraternity photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read fraternity photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete fraternity photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read fraternity photos" ON storage.objects;

-- Fraternity admins can upload photos for their fraternity
-- Path format: {fraternityId}/{timestamp}-{filename} OR temp/{userId}/{timestamp}-{filename} for creation
-- Note: We check if user is admin via a function to avoid RLS recursion
-- EXCEPTION: Allow temp/{userId}/... paths for fraternity creation (before fraternity exists)
CREATE POLICY "Admins can upload fraternity photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'fraternity-photos' 
  AND (
    -- Allow temp uploads during fraternity creation
    (storage.foldername(name))[1] = 'temp'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  OR (
    -- Allow admins to upload for existing fraternities
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = (storage.foldername(name))[1]::TEXT
      AND gm.user_id = auth.uid()::TEXT
      AND gm.role = 'admin'
    )
  )
);

-- Fraternity admins can read photos for their fraternity
CREATE POLICY "Admins can read fraternity photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'fraternity-photos' 
  AND EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = (storage.foldername(name))[1]::TEXT
    AND gm.user_id = auth.uid()::TEXT
    AND gm.role = 'admin'
  )
);

-- Fraternity admins can delete photos for their fraternity
CREATE POLICY "Admins can delete fraternity photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'fraternity-photos' 
  AND EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = (storage.foldername(name))[1]::TEXT
    AND gm.user_id = auth.uid()::TEXT
    AND gm.role = 'admin'
  )
);

-- Public can read fraternity photos (for displaying in app)
CREATE POLICY "Public can read fraternity photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'fraternity-photos');

-- ============================================
-- Create event-images storage bucket
-- ============================================

-- Create bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- RLS Policies for event-images bucket
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete event images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read event images" ON storage.objects;

-- Event admins can upload images for their events
-- Path format: {eventId}/{timestamp}-{filename} OR temp/{userId}/{timestamp}-{filename} for creation
-- Note: We check if user is admin via a function to avoid RLS recursion
-- EXCEPTION: Allow temp/{userId}/... paths for event creation (before event exists)
CREATE POLICY "Admins can upload event images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images' 
  AND (
    -- Allow temp uploads during event creation
    (storage.foldername(name))[1] = 'temp'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  OR (
    -- Allow admins to upload for existing events
    EXISTS (
      SELECT 1 FROM event e
      JOIN group_members gm ON gm.group_id = e.frat_id
      WHERE e.id = (storage.foldername(name))[1]::TEXT
      AND gm.user_id = auth.uid()::TEXT
      AND gm.role = 'admin'
    )
  )
);

-- Event admins can read images for their events
CREATE POLICY "Admins can read event images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'event-images' 
  AND EXISTS (
    SELECT 1 FROM event e
    JOIN group_members gm ON gm.group_id = e.frat_id
    WHERE e.id = (storage.foldername(name))[1]::TEXT
    AND gm.user_id = auth.uid()::TEXT
    AND gm.role = 'admin'
  )
);

-- Event admins can delete images for their events
CREATE POLICY "Admins can delete event images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images' 
  AND EXISTS (
    SELECT 1 FROM event e
    JOIN group_members gm ON gm.group_id = e.frat_id
    WHERE e.id = (storage.foldername(name))[1]::TEXT
    AND gm.user_id = auth.uid()::TEXT
    AND gm.role = 'admin'
  )
);

-- Public can read event images (for displaying in app)
CREATE POLICY "Public can read event images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-images');

