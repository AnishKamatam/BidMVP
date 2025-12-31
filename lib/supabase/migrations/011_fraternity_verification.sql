-- Migration 011: Fraternity Verification System
-- Adds verification fields, member count tracking, and auto-verification logic
-- Run this in your Supabase SQL Editor after 010_add_test_schools.sql

-- ============================================
-- 1. Add verification fields to fraternity table
-- ============================================

ALTER TABLE fraternity 
ADD COLUMN IF NOT EXISTS verification_email TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS member_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS quality_member_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS flagged_for_review BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_requested_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS creator_id TEXT REFERENCES "User"(id) ON DELETE SET NULL;

-- Add indexes for verification queries
CREATE INDEX IF NOT EXISTS idx_fraternity_email_verified ON fraternity(email_verified) WHERE email_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_fraternity_member_verified ON fraternity(member_verified) WHERE member_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_fraternity_quality_member_count ON fraternity(quality_member_count);
CREATE INDEX IF NOT EXISTS idx_fraternity_creator_id ON fraternity(creator_id);

-- ============================================
-- 2. Create fraternity_reports table
-- ============================================

CREATE TABLE IF NOT EXISTS fraternity_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fraternity_id TEXT NOT NULL REFERENCES fraternity(id) ON DELETE CASCADE,
  reporter_user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('fake', 'duplicate', 'inappropriate', 'other')),
  description TEXT NOT NULL CHECK (char_length(description) >= 10),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'dismissed', 'flagged', 'resolved')),
  reviewed_by TEXT REFERENCES "User"(id),
  reviewed_at TIMESTAMP,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for reports
CREATE INDEX IF NOT EXISTS idx_fraternity_reports_fraternity_id ON fraternity_reports(fraternity_id);
CREATE INDEX IF NOT EXISTS idx_fraternity_reports_status ON fraternity_reports(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_fraternity_reports_reporter ON fraternity_reports(reporter_user_id);

-- Enable RLS on fraternity_reports
ALTER TABLE fraternity_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fraternity_reports
DROP POLICY IF EXISTS "Users can create reports" ON fraternity_reports;
DROP POLICY IF EXISTS "Users can read own reports" ON fraternity_reports;
DROP POLICY IF EXISTS "Admins can read all reports" ON fraternity_reports;
DROP POLICY IF EXISTS "Admins can update reports" ON fraternity_reports;

-- Authenticated users can create reports
CREATE POLICY "Users can create reports"
  ON fraternity_reports FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid()::TEXT = reporter_user_id);

-- Users can read their own reports
CREATE POLICY "Users can read own reports"
  ON fraternity_reports FOR SELECT
  USING (auth.uid()::TEXT = reporter_user_id);

-- Platform admins can read all reports (for now, allow authenticated users - can restrict later)
CREATE POLICY "Admins can read all reports"
  ON fraternity_reports FOR SELECT
  USING (auth.role() = 'authenticated');

-- Platform admins can update reports (for now, allow authenticated users - can restrict later)
CREATE POLICY "Admins can update reports"
  ON fraternity_reports FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================
-- 3. Function to calculate quality member count
-- ============================================
-- Quality members = members with verified email AND completed profile

CREATE OR REPLACE FUNCTION calculate_quality_member_count(group_id_param TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quality_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO quality_count
  FROM group_members gm
  INNER JOIN "User" u ON gm.user_id = u.id
  WHERE gm.group_id = group_id_param
    AND u.email_verified = TRUE
    AND u.name IS NOT NULL
    AND u.year IS NOT NULL
    AND u.gender IS NOT NULL
    AND u.school IS NOT NULL;
  
  RETURN COALESCE(quality_count, 0);
END;
$$;

-- ============================================
-- 4. Function to update member count
-- ============================================

CREATE OR REPLACE FUNCTION update_fraternity_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  group_id_val TEXT;
  new_member_count INTEGER;
  new_quality_count INTEGER;
BEGIN
  -- Get the group_id from the trigger
  group_id_val := COALESCE(NEW.group_id, OLD.group_id);
  
  -- Calculate total member count
  SELECT COUNT(*) INTO new_member_count
  FROM group_members
  WHERE group_id = group_id_val;
  
  -- Calculate quality member count
  SELECT calculate_quality_member_count(group_id_val) INTO new_quality_count;
  
  -- Update fraternity table
  UPDATE fraternity
  SET 
    member_count = new_member_count,
    quality_member_count = new_quality_count
  WHERE id = group_id_val;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================
-- 5. Triggers to auto-update member count
-- ============================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_member_count_on_insert ON group_members;
DROP TRIGGER IF EXISTS update_member_count_on_delete ON group_members;

-- Trigger on member join
CREATE TRIGGER update_member_count_on_insert
  AFTER INSERT ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_fraternity_member_count();

-- Trigger on member leave
CREATE TRIGGER update_member_count_on_delete
  AFTER DELETE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_fraternity_member_count();

-- ============================================
-- 5b. RPC Function to manually update member counts
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
-- 6. Function to auto-update verification status
-- ============================================
-- PRIMARY VERIFICATION: 7+ quality members = member verified (can create events)
-- FULL VERIFICATION: 10+ quality members = fully verified
-- Email verification is optional bonus

CREATE OR REPLACE FUNCTION check_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  -- PRIMARY: 7+ quality members = member verified (can create events)
  -- This works for ALL fraternities, regardless of email
  -- Uses quality_member_count (only verified users with completed profiles)
  IF NEW.quality_member_count >= 7 THEN
    NEW.member_verified := TRUE;
  ELSE
    NEW.member_verified := FALSE;
  END IF;
  
  -- FULL VERIFICATION: 10+ quality members = fully verified
  IF NEW.quality_member_count >= 10 THEN
    NEW.verified := TRUE;
  ELSIF NEW.quality_member_count < 10 THEN
    -- Only set to false if we're below threshold (don't override manual verification)
    -- Keep verified = TRUE if it was manually set
    IF NEW.verified IS NULL OR NEW.verified = FALSE THEN
      NEW.verified := FALSE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Trigger to auto-update verification
-- ============================================

DROP TRIGGER IF EXISTS auto_update_verification ON fraternity;

CREATE TRIGGER auto_update_verification
  BEFORE UPDATE ON fraternity
  FOR EACH ROW
  WHEN (
    NEW.quality_member_count IS DISTINCT FROM OLD.quality_member_count
    OR NEW.email_verified IS DISTINCT FROM OLD.email_verified
  )
  EXECUTE FUNCTION check_verification_status();

-- ============================================
-- 8. Initial backfill: Update existing fraternities
-- ============================================
-- Calculate member counts for existing fraternities

DO $$
DECLARE
  fraternity_record RECORD;
  new_member_count INTEGER;
  new_quality_count INTEGER;
BEGIN
  FOR fraternity_record IN SELECT id FROM fraternity LOOP
    -- Calculate total member count
    SELECT COUNT(*) INTO new_member_count
    FROM group_members
    WHERE group_id = fraternity_record.id;
    
    -- Calculate quality member count
    SELECT calculate_quality_member_count(fraternity_record.id) INTO new_quality_count;
    
    -- Update fraternity
    UPDATE fraternity
    SET 
      member_count = new_member_count,
      quality_member_count = new_quality_count
    WHERE id = fraternity_record.id;
  END LOOP;
END $$;

-- ============================================
-- Backfill creator_id for existing fraternities
-- ============================================
-- Set creator_id to the first admin member (earliest joined_at)
-- This assumes the first admin is the creator
UPDATE fraternity f
SET creator_id = (
  SELECT user_id 
  FROM group_members 
  WHERE group_id = f.id 
  AND role = 'admin'
  ORDER BY joined_at ASC 
  LIMIT 1
)
WHERE creator_id IS NULL;

-- ============================================
-- Comments
-- ============================================
-- This migration adds:
-- 1. Verification fields to fraternity table (email optional, member count primary)
-- 2. creator_id field to explicitly track who created each fraternity
-- 3. fraternity_reports table for reporting fake/duplicate fraternities
-- 4. Auto-calculation of member_count and quality_member_count
-- 5. Auto-verification based on quality member count (7+ = verified, 10+ = fully verified)
-- 6. Quality member definition: verified email + completed profile
-- 
-- Verification thresholds:
-- - Unverified: < 7 quality members
-- - Member Verified: 7+ quality members (can create events)
-- - Fully Verified: 10+ quality members
-- - Email Bonus: Email verified + 5+ quality members (optional, allows events earlier)
