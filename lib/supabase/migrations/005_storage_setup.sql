-- Migration 005: Storage bucket setup for profile photos
-- Run this in your Supabase SQL Editor

-- ============================================
-- Create profile-photos storage bucket
-- ============================================

-- Create bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
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

