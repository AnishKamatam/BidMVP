-- Migration 013: Add RPC function to manually refresh member counts
-- This function can be called from application code to ensure counts are updated
-- Run this in your Supabase SQL Editor if member counts aren't updating

-- ============================================
-- RPC Function to manually update member counts
-- ============================================
-- This can be called from application code to ensure counts are updated
-- SECURITY DEFINER allows it to bypass RLS when updating fraternity table

CREATE OR REPLACE FUNCTION refresh_fraternity_member_counts(p_group_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_member_count INTEGER;
  new_quality_count INTEGER;
BEGIN
  -- Calculate total member count
  SELECT COUNT(*) INTO new_member_count
  FROM group_members
  WHERE group_id = p_group_id;
  
  -- Calculate quality member count
  SELECT calculate_quality_member_count(p_group_id) INTO new_quality_count;
  
  -- Update fraternity table (bypasses RLS due to SECURITY DEFINER)
  UPDATE fraternity
  SET 
    member_count = new_member_count,
    quality_member_count = new_quality_count
  WHERE id = p_group_id;
END;
$$;

-- ============================================
-- Backfill: Update counts for all existing fraternities
-- ============================================
-- This will update member counts for all fraternities that might be out of sync

DO $$
DECLARE
  fraternity_record RECORD;
BEGIN
  FOR fraternity_record IN SELECT id FROM fraternity LOOP
    PERFORM refresh_fraternity_member_counts(fraternity_record.id);
  END LOOP;
END $$;

-- ============================================
-- Notes
-- ============================================
-- This function is called automatically when members are added/removed
-- It uses SECURITY DEFINER to bypass RLS and ensure counts are always updated
-- The backfill script above will fix any existing fraternities with incorrect counts

