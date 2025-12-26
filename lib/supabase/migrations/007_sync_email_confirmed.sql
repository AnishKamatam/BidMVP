-- Migration 007: Sync email_confirmed_at from auth.users to User table
-- Automatically updates User.email_confirmed_at when auth.users.email_confirmed_at changes
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Ensure User table has email_confirmed_at and email_verified columns
-- ============================================
-- Add email_confirmed_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'email_confirmed_at'
  ) THEN
    ALTER TABLE "User" 
    ADD COLUMN email_confirmed_at TIMESTAMP;
  END IF;
  
  -- Add email_verified boolean column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE "User" 
    ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- ============================================
-- 2. Create function to sync email_confirmed_at
-- ============================================
-- This function updates the User table when auth.users.email_confirmed_at changes
-- IMPORTANT: This must NOT fail if User record doesn't exist (user might verify before profile creation)

CREATE OR REPLACE FUNCTION sync_email_confirmed_at()
RETURNS TRIGGER AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Update User table when email_confirmed_at changes in auth.users
  -- CRITICAL: This function must NEVER raise an exception that blocks auth operations
  -- If anything fails, we silently continue - email confirmation must succeed
  
  -- Only proceed if email_confirmed_at actually changed and is not null
  IF NEW.email_confirmed_at IS DISTINCT FROM OLD.email_confirmed_at AND NEW.email_confirmed_at IS NOT NULL THEN
    -- First, check if User record exists (user might verify email before creating profile)
    -- Use a separate query to avoid any issues with the update
    BEGIN
      SELECT EXISTS(SELECT 1 FROM "User" WHERE id = NEW.id::text) INTO user_exists;
      
      -- Only update if User record exists
      IF user_exists THEN
        -- Attempt the update, but catch any errors
        BEGIN
          UPDATE "User"
          SET 
            email_confirmed_at = NEW.email_confirmed_at,
            email_verified = (NEW.email_confirmed_at IS NOT NULL)
          WHERE id = NEW.id::text;
        EXCEPTION
          WHEN OTHERS THEN
            -- If update fails for any reason (column doesn't exist, permission issue, etc.)
            -- Log a warning but don't fail - email confirmation must succeed
            -- Using RAISE with LOG level so it doesn't block the operation
            RAISE LOG 'Failed to sync email_confirmed_at for user %: %', NEW.id, SQLERRM;
        END;
      END IF;
      -- If User record doesn't exist, that's fine - it will be created during profile setup
    EXCEPTION
      WHEN OTHERS THEN
        -- If even the existence check fails, log but don't fail
        -- This ensures email confirmation can still succeed
        RAISE LOG 'Error checking User existence for sync_email_confirmed_at: %', SQLERRM;
    END;
  END IF;
  
  -- Always return NEW to allow the auth operation to proceed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. Create trigger on auth.users table
-- ============================================
-- This trigger fires whenever email_confirmed_at is updated in auth.users
-- IMPORTANT: The trigger function is designed to never fail, so it won't block email confirmation

DROP TRIGGER IF EXISTS sync_user_email_confirmed ON auth.users;

CREATE TRIGGER sync_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS DISTINCT FROM OLD.email_confirmed_at AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION sync_email_confirmed_at();

-- ============================================
-- 3b. Create trigger on User table to sync email_verified
-- ============================================
-- This trigger automatically sets email_verified = true when email_confirmed_at is set
-- This ensures email_verified stays in sync even if updated directly

CREATE OR REPLACE FUNCTION sync_email_verified_from_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- If email_confirmed_at is not null, set email_verified to true
  -- If email_confirmed_at is null, set email_verified to false
  IF NEW.email_confirmed_at IS DISTINCT FROM OLD.email_confirmed_at THEN
    NEW.email_verified = (NEW.email_confirmed_at IS NOT NULL);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_email_verified_trigger ON "User";

CREATE TRIGGER sync_email_verified_trigger
  BEFORE UPDATE OF email_confirmed_at ON "User"
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS DISTINCT FROM OLD.email_confirmed_at)
  EXECUTE FUNCTION sync_email_verified_from_confirmed();

-- ============================================
-- 4. Sync existing email_confirmed_at values and set email_verified
-- ============================================
-- Update User table with current email_confirmed_at values from auth.users
-- Also set email_verified to true if email_confirmed_at is not null
UPDATE "User" u
SET 
  email_confirmed_at = au.email_confirmed_at,
  email_verified = (au.email_confirmed_at IS NOT NULL)
FROM auth.users au
WHERE u.id = au.id::text
  AND au.email_confirmed_at IS NOT NULL
  AND (u.email_confirmed_at IS NULL OR u.email_confirmed_at != au.email_confirmed_at);

-- ============================================
-- Notes
-- ============================================
-- This migration is idempotent - safe to run multiple times
-- The trigger automatically syncs email_confirmed_at whenever it changes in auth.users
-- Existing values are synced on first run
-- SECURITY DEFINER allows the function to update the User table

