-- Migration 006: Fix User table timestamp fields
-- Ensures created_at and updated_at have proper defaults and triggers
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Ensure created_at and updated_at have defaults
-- ============================================
-- Add DEFAULT CURRENT_TIMESTAMP if columns don't have defaults
-- This prevents NOT NULL constraint violations during INSERT

-- Check if created_at column exists and add default if needed
DO $$
BEGIN
  -- Add created_at column with default if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE "User" 
    ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  ELSE
    -- If column exists but no default, add it
    ALTER TABLE "User" 
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
  END IF;

  -- Add updated_at column with default if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE "User" 
    ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  ELSE
    -- If column exists but no default, add it
    ALTER TABLE "User" 
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- ============================================
-- 2. Create trigger to auto-update updated_at on UPDATE
-- ============================================
-- Similar to rush_notes table pattern
-- Automatically updates updated_at whenever User record is updated

CREATE OR REPLACE FUNCTION update_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS user_updated_at ON "User";

-- Create trigger
CREATE TRIGGER user_updated_at
  BEFORE UPDATE ON "User"
  FOR EACH ROW
  EXECUTE FUNCTION update_user_updated_at();

-- ============================================
-- 3. Set updated_at for existing records (if any)
-- ============================================
-- Update any existing records that might have NULL updated_at
UPDATE "User"
SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
WHERE updated_at IS NULL;

-- ============================================
-- Notes
-- ============================================
-- This migration is idempotent - safe to run multiple times
-- Uses DO block to conditionally alter columns
-- Trigger ensures updated_at is always current on UPDATE operations
-- Defaults ensure timestamps are set on INSERT even if not explicitly provided

