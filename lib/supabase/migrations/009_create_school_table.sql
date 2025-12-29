-- Migration 009: Create school table for campus detection
-- This table stores school/campus information linked to email domains
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Create school table
-- ============================================
-- Stores school information with email domain for campus detection
CREATE TABLE IF NOT EXISTS school (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL, -- Full school name (e.g., "Stanford University")
  domain TEXT NOT NULL UNIQUE, -- Email domain (e.g., "stanford.edu")
  abbreviation TEXT, -- Optional short name (e.g., "Stanford")
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. Create indexes for performance
-- ============================================
-- Index on domain for fast lookups (most common query)
CREATE INDEX IF NOT EXISTS idx_school_domain ON school(domain);

-- Index on name for search functionality
CREATE INDEX IF NOT EXISTS idx_school_name ON school(name);

-- ============================================
-- 3. Create trigger to auto-update updated_at
-- ============================================
-- Automatically updates updated_at whenever school record is updated
CREATE OR REPLACE FUNCTION update_school_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS school_updated_at ON school;

-- Create trigger
CREATE TRIGGER school_updated_at
  BEFORE UPDATE ON school
  FOR EACH ROW
  EXECUTE FUNCTION update_school_updated_at();

-- ============================================
-- 4. Backfill existing User.school string values to school_id
-- ============================================
-- Attempts to link existing users to schools based on their school string field
-- This is a best-effort migration - may not match all cases
DO $$
DECLARE
  user_record RECORD;
  school_id_val TEXT;
BEGIN
  -- Loop through users that have a school string but no school_id
  FOR user_record IN 
    SELECT id, school 
    FROM "User" 
    WHERE school IS NOT NULL 
      AND school_id IS NULL
      AND school != ''
  LOOP
    -- Try to find existing school by domain (school string should be domain)
    SELECT id INTO school_id_val
    FROM school
    WHERE domain = LOWER(user_record.school);
    
    -- If school found, link user to it
    IF school_id_val IS NOT NULL THEN
      UPDATE "User"
      SET school_id = school_id_val
      WHERE id = user_record.id;
    ELSE
      -- If school doesn't exist, create it
      -- Use school string as both name and domain (best guess)
      -- First check if it exists to avoid conflict
      SELECT id INTO school_id_val
      FROM school
      WHERE domain = LOWER(user_record.school);
      
      -- Only insert if it doesn't exist
      IF school_id_val IS NULL THEN
        -- Generate UUID for new school
        school_id_val := gen_random_uuid()::TEXT;
        
        INSERT INTO school (id, name, domain)
        VALUES (school_id_val, user_record.school, LOWER(user_record.school));
      END IF;
      
      -- Link user if school was created
      IF school_id_val IS NOT NULL THEN
        UPDATE "User"
        SET school_id = school_id_val
        WHERE id = user_record.id;
      END IF;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- 5. Add RLS policies for school table
-- ============================================
-- Enable RLS on school table
ALTER TABLE school ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read schools (public data)
DROP POLICY IF EXISTS "Schools are viewable by everyone" ON school;
CREATE POLICY "Schools are viewable by everyone"
  ON school
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can create schools (for auto-creation during signup)
DROP POLICY IF EXISTS "Authenticated users can create schools" ON school;
CREATE POLICY "Authenticated users can create schools"
  ON school
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Only authenticated users can update schools (for future admin features)
DROP POLICY IF EXISTS "Authenticated users can update schools" ON school;
CREATE POLICY "Authenticated users can update schools"
  ON school
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Notes
-- ============================================
-- This migration is idempotent - safe to run multiple times
-- The backfill script attempts to link existing users to schools
-- RLS policies allow public reads and authenticated writes
-- The school table is referenced by User.school_id foreign key (from migration 001)

