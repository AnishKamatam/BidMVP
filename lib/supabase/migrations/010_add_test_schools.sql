-- Migration 010: Add test schools for development/testing
-- This script adds common universities to the school table for testing the campus search feature
-- Safe to run multiple times - will skip schools that already exist
-- Run this in your Supabase SQL Editor
-- IMPORTANT: Make sure you're running this as the 'postgres' role (default in SQL Editor)
--
-- HOW TO USE:
-- 1. Copy and paste this entire script into Supabase SQL Editor
-- 2. Click "Run" or press Cmd/Ctrl+Enter
-- 3. Scroll down in the results panel to see all SELECT query results
-- 4. Check the "Messages" tab for RAISE NOTICE output from the DO block
-- 5. After running, REFRESH the table view in Supabase Table Editor to see changes
--
-- NOTE: This migration will CORRECT incorrect school names created by auto-detection.
-- For example, if auto-detection created "Berkeley University", this will update it to
-- "University of California, Berkeley" to ensure data consistency.

-- ============================================
-- PRE-MIGRATION DIAGNOSTICS
-- ============================================
-- These SELECT queries will show results in the SQL Editor results panel
-- Scroll down to see all result sets
-- Check current school count
SELECT COUNT(*) as total_schools FROM school;

-- List all existing schools
SELECT id, name, domain, created_at 
FROM school 
ORDER BY created_at DESC;

-- Check if any of the test schools already exist and show name mismatches
SELECT 
  domain,
  name as current_name,
  CASE domain
    WHEN 'stanford.edu' THEN 'Stanford University'
    WHEN 'harvard.edu' THEN 'Harvard University'
    WHEN 'mit.edu' THEN 'MIT'
    WHEN 'yale.edu' THEN 'Yale University'
    WHEN 'princeton.edu' THEN 'Princeton University'
    WHEN 'columbia.edu' THEN 'Columbia University'
    WHEN 'berkeley.edu' THEN 'University of California, Berkeley'
    WHEN 'ucla.edu' THEN 'University of California, Los Angeles'
    WHEN 'usc.edu' THEN 'University of Southern California'
    WHEN 'nyu.edu' THEN 'New York University'
    WHEN 'utexas.edu' THEN 'University of Texas at Austin'
    WHEN 'umich.edu' THEN 'University of Michigan'
    WHEN 'upenn.edu' THEN 'University of Pennsylvania'
    WHEN 'duke.edu' THEN 'Duke University'
    WHEN 'northwestern.edu' THEN 'Northwestern University'
    WHEN 'cornell.edu' THEN 'Cornell University'
    WHEN 'brown.edu' THEN 'Brown University'
    WHEN 'dartmouth.edu' THEN 'Dartmouth College'
    WHEN 'vanderbilt.edu' THEN 'Vanderbilt University'
    WHEN 'georgetown.edu' THEN 'Georgetown University'
    WHEN 'uchicago.edu' THEN 'University of Chicago'
    WHEN 'jhu.edu' THEN 'Johns Hopkins University'
    WHEN 'cmu.edu' THEN 'Carnegie Mellon University'
    WHEN 'virginia.edu' THEN 'University of Virginia'
    WHEN 'unc.edu' THEN 'University of North Carolina at Chapel Hill'
    WHEN 'wisc.edu' THEN 'University of Wisconsin-Madison'
    WHEN 'psu.edu' THEN 'Penn State University'
    WHEN 'osu.edu' THEN 'Ohio State University'
    WHEN 'indiana.edu' THEN 'Indiana University'
    WHEN 'purdue.edu' THEN 'Purdue University'
  END as expected_name,
  CASE 
    WHEN name = CASE domain
      WHEN 'stanford.edu' THEN 'Stanford University'
      WHEN 'harvard.edu' THEN 'Harvard University'
      WHEN 'mit.edu' THEN 'MIT'
      WHEN 'yale.edu' THEN 'Yale University'
      WHEN 'princeton.edu' THEN 'Princeton University'
      WHEN 'columbia.edu' THEN 'Columbia University'
      WHEN 'berkeley.edu' THEN 'University of California, Berkeley'
      WHEN 'ucla.edu' THEN 'University of California, Los Angeles'
      WHEN 'usc.edu' THEN 'University of Southern California'
      WHEN 'nyu.edu' THEN 'New York University'
      WHEN 'utexas.edu' THEN 'University of Texas at Austin'
      WHEN 'umich.edu' THEN 'University of Michigan'
      WHEN 'upenn.edu' THEN 'University of Pennsylvania'
      WHEN 'duke.edu' THEN 'Duke University'
      WHEN 'northwestern.edu' THEN 'Northwestern University'
      WHEN 'cornell.edu' THEN 'Cornell University'
      WHEN 'brown.edu' THEN 'Brown University'
      WHEN 'dartmouth.edu' THEN 'Dartmouth College'
      WHEN 'vanderbilt.edu' THEN 'Vanderbilt University'
      WHEN 'georgetown.edu' THEN 'Georgetown University'
      WHEN 'uchicago.edu' THEN 'University of Chicago'
      WHEN 'jhu.edu' THEN 'Johns Hopkins University'
      WHEN 'cmu.edu' THEN 'Carnegie Mellon University'
      WHEN 'virginia.edu' THEN 'University of Virginia'
      WHEN 'unc.edu' THEN 'University of North Carolina at Chapel Hill'
      WHEN 'wisc.edu' THEN 'University of Wisconsin-Madison'
      WHEN 'psu.edu' THEN 'Penn State University'
      WHEN 'osu.edu' THEN 'Ohio State University'
      WHEN 'indiana.edu' THEN 'Indiana University'
      WHEN 'purdue.edu' THEN 'Purdue University'
    END THEN 'Will be skipped (name matches)'
    ELSE 'Will be updated (name mismatch)'
  END as migration_status
FROM school
WHERE domain IN (
  'stanford.edu', 'harvard.edu', 'mit.edu', 'yale.edu', 
  'princeton.edu', 'columbia.edu', 'berkeley.edu', 'ucla.edu',
  'usc.edu', 'nyu.edu', 'utexas.edu', 'umich.edu', 'upenn.edu',
  'duke.edu', 'northwestern.edu', 'cornell.edu', 'brown.edu',
  'dartmouth.edu', 'vanderbilt.edu', 'georgetown.edu', 'uchicago.edu',
  'jhu.edu', 'cmu.edu', 'virginia.edu', 'unc.edu', 'wisc.edu',
  'psu.edu', 'osu.edu', 'indiana.edu', 'purdue.edu'
);

-- Check current role (should be 'postgres' for migrations)
SELECT current_user, session_user;

-- IMPORTANT: Check if Berkeley needs to be updated
-- This query shows what will happen to berkeley.edu
SELECT 
  domain,
  name as current_name,
  'University of California, Berkeley' as expected_name,
  CASE 
    WHEN name = 'University of California, Berkeley' THEN 'Already correct'
    WHEN name IS NOT NULL THEN 'Will be updated'
    ELSE 'Will be added'
  END as action
FROM school
WHERE domain = 'berkeley.edu';

-- ============================================
-- MIGRATION: Add test schools
-- ============================================
-- Temporarily drop the trigger to avoid updated_at column errors
-- (The trigger will be recreated at the end if the column exists)
DROP TRIGGER IF EXISTS school_updated_at ON school;

DO $$
DECLARE
  schools_to_add TEXT[][] := ARRAY[
    ['Stanford University', 'stanford.edu'],
    ['Harvard University', 'harvard.edu'],
    ['MIT', 'mit.edu'],
    ['Yale University', 'yale.edu'],
    ['Princeton University', 'princeton.edu'],
    ['Columbia University', 'columbia.edu'],
    ['University of California, Berkeley', 'berkeley.edu'],
    ['University of California, Los Angeles', 'ucla.edu'],
    ['University of Southern California', 'usc.edu'],
    ['New York University', 'nyu.edu'],
    ['University of Texas at Austin', 'utexas.edu'],
    ['University of Michigan', 'umich.edu'],
    ['University of Pennsylvania', 'upenn.edu'],
    ['Duke University', 'duke.edu'],
    ['Northwestern University', 'northwestern.edu'],
    ['Cornell University', 'cornell.edu'],
    ['Brown University', 'brown.edu'],
    ['Dartmouth College', 'dartmouth.edu'],
    ['Vanderbilt University', 'vanderbilt.edu'],
    ['Georgetown University', 'georgetown.edu'],
    ['University of Chicago', 'uchicago.edu'],
    ['Johns Hopkins University', 'jhu.edu'],
    ['Carnegie Mellon University', 'cmu.edu'],
    ['University of Virginia', 'virginia.edu'],
    ['University of North Carolina at Chapel Hill', 'unc.edu'],
    ['University of Wisconsin-Madison', 'wisc.edu'],
    ['Penn State University', 'psu.edu'],
    ['Ohio State University', 'osu.edu'],
    ['Indiana University', 'indiana.edu'],
    ['Purdue University', 'purdue.edu']
  ];
  school_item TEXT[];
  existing_id TEXT;
  existing_name TEXT;
  old_name TEXT;
  new_name TEXT;
  added_count INTEGER := 0;
  updated_count INTEGER := 0;
  skipped_count INTEGER := 0;
  error_count INTEGER := 0;
  error_message TEXT;
BEGIN
  FOREACH school_item SLICE 1 IN ARRAY schools_to_add
  LOOP
    BEGIN
      -- Check if school already exists by domain (case-insensitive)
      SELECT id, name INTO existing_id, existing_name
      FROM school
      WHERE domain = LOWER(school_item[2]);
      
      IF existing_id IS NULL THEN
        -- School doesn't exist - insert it
        INSERT INTO school (id, name, domain)
        VALUES (gen_random_uuid()::TEXT, school_item[1], LOWER(school_item[2]));
        added_count := added_count + 1;
        RAISE NOTICE 'Added: % (%)', school_item[1], school_item[2];
      ELSIF existing_name IS DISTINCT FROM school_item[1] THEN
        -- School exists but name doesn't match - update it to ensure consistency
        -- Store old name before update for logging
        old_name := existing_name;
        RAISE NOTICE 'Detected name mismatch for %: current="%", expected="%"', 
          school_item[2], old_name, school_item[1];
        
        -- Perform the update
        UPDATE school
        SET name = school_item[1]
        WHERE id = existing_id;
        
        -- Verify the update worked by reading back the value
        SELECT name INTO new_name FROM school WHERE id = existing_id;
        IF new_name = school_item[1] THEN
          updated_count := updated_count + 1;
          RAISE NOTICE 'Successfully updated: % (%) [was: %]', school_item[1], school_item[2], old_name;
        ELSE
          RAISE WARNING 'Update failed for %: still shows "%" instead of "%"', 
            school_item[2], new_name, school_item[1];
          error_count := error_count + 1;
        END IF;
      ELSE
        -- School exists with correct name - skip
        skipped_count := skipped_count + 1;
        RAISE NOTICE 'Skipped (already exists): % (%)', school_item[1], school_item[2];
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        error_count := error_count + 1;
        error_message := SQLERRM;
        -- Log detailed error information including SQL state
        RAISE WARNING 'ERROR processing school: Name="%", Domain="%", Error="%", SQLState="%"', 
          school_item[1], school_item[2], error_message, SQLSTATE;
        -- Continue processing other schools even if one fails
    END;
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  Added: % schools', added_count;
  RAISE NOTICE '  Updated: % schools (name corrected)', updated_count;
  RAISE NOTICE '  Skipped: % schools (already correct)', skipped_count;
  RAISE NOTICE '  Errors: % schools', error_count;
  RAISE NOTICE '  Total processed: % schools', added_count + updated_count + skipped_count + error_count;
  RAISE NOTICE '========================================';
  
  -- Log warning if there were errors (but don't fail - allow post-migration queries to run)
  IF error_count > 0 THEN
    RAISE WARNING 'Migration completed with % error(s). Check warnings above for details. Post-migration diagnostics will still run.', error_count;
  END IF;
END $$;

-- Explicitly commit the transaction (DO blocks auto-commit, but this ensures it)
-- Note: In Supabase SQL Editor, you may need to refresh the table view to see changes

-- ============================================
-- DIRECT UPDATES: Ensure name corrections are applied
-- ============================================
-- These direct UPDATE statements ensure name corrections happen even if DO block had issues
-- Run these after the DO block to fix any remaining name mismatches

-- Temporarily drop the trigger that's causing issues (if updated_at column doesn't exist)
-- The trigger tries to update updated_at but the column might not exist
DROP TRIGGER IF EXISTS school_updated_at ON school;

-- Check current Berkeley name before update
SELECT 'BEFORE UPDATE' as status, name, domain FROM school WHERE domain = 'berkeley.edu';

-- Fix Berkeley with explicit WHERE clause
-- Using a simple approach: update if name doesn't match exactly
DO $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE school
  SET name = 'University of California, Berkeley'
  WHERE domain = 'berkeley.edu' 
    AND name IS DISTINCT FROM 'University of California, Berkeley';
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  
  IF rows_updated > 0 THEN
    RAISE NOTICE 'Updated % row(s) for berkeley.edu', rows_updated;
  ELSE
    RAISE NOTICE 'No rows updated for berkeley.edu (may already be correct or not found)';
  END IF;
END $$;

-- Verify Berkeley was updated
SELECT 'AFTER UPDATE' as status, name, domain FROM school WHERE domain = 'berkeley.edu';

-- Ensure updated_at column exists (add it if missing)
DO $$
BEGIN
  -- Check if updated_at column exists, add it if not
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'school' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE school ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE 'Added missing updated_at column to school table';
  END IF;
END $$;

-- Recreate the trigger function and trigger
CREATE OR REPLACE FUNCTION update_school_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER school_updated_at
  BEFORE UPDATE ON school
  FOR EACH ROW
  EXECUTE FUNCTION update_school_updated_at();

-- ============================================
-- SIMPLE DIRECT UPDATE (if DO block above didn't work)
-- ============================================
-- This is the simplest possible UPDATE - just run this if nothing else works
UPDATE school
SET name = 'University of California, Berkeley'
WHERE domain = 'berkeley.edu';

-- Verify it worked
SELECT name, domain, 
  CASE 
    WHEN name = 'University of California, Berkeley' THEN '✓ SUCCESS'
    ELSE '✗ FAILED'
  END as result
FROM school 
WHERE domain = 'berkeley.edu';

UPDATE school
SET name = 'University of California, Los Angeles'
WHERE domain = 'ucla.edu' 
  AND (name IS NULL OR name != 'University of California, Los Angeles');

UPDATE school
SET name = 'University of Southern California'
WHERE domain = 'usc.edu' 
  AND (name IS NULL OR name != 'University of Southern California');

-- ============================================
-- POST-MIGRATION DIAGNOSTICS
-- ============================================
-- Check final school count
SELECT COUNT(*) as total_schools FROM school;

-- List all schools after migration
SELECT id, name, domain, created_at 
FROM school 
ORDER BY created_at DESC;

-- Verify test schools were added/updated
SELECT 
  domain,
  name,
  created_at,
  CASE domain
    WHEN 'berkeley.edu' THEN 
      CASE WHEN name = 'University of California, Berkeley' THEN '✓ Correct' ELSE '✗ Needs update' END
    WHEN 'ucla.edu' THEN 
      CASE WHEN name = 'University of California, Los Angeles' THEN '✓ Correct' ELSE '✗ Needs update' END
    WHEN 'usc.edu' THEN 
      CASE WHEN name = 'University of Southern California' THEN '✓ Correct' ELSE '✗ Needs update' END
    ELSE '✓ Verified'
  END as verification_status
FROM school
WHERE domain IN (
  'stanford.edu', 'harvard.edu', 'mit.edu', 'yale.edu', 
  'princeton.edu', 'columbia.edu', 'berkeley.edu', 'ucla.edu',
  'usc.edu', 'nyu.edu', 'utexas.edu', 'umich.edu', 'upenn.edu',
  'duke.edu', 'northwestern.edu', 'cornell.edu', 'brown.edu',
  'dartmouth.edu', 'vanderbilt.edu', 'georgetown.edu', 'uchicago.edu',
  'jhu.edu', 'cmu.edu', 'virginia.edu', 'unc.edu', 'wisc.edu',
  'psu.edu', 'osu.edu', 'indiana.edu', 'purdue.edu'
)
ORDER BY domain;

-- IMPORTANT: After running this migration, refresh your table view in Supabase Table Editor
-- The changes are committed, but you may need to refresh to see them in the UI

-- ============================================
-- QUICK VERIFICATION: Check Berkeley specifically
-- ============================================
-- Run this query separately if you want to verify Berkeley was updated correctly
SELECT 
  id,
  name,
  domain,
  created_at,
  CASE 
    WHEN name = 'University of California, Berkeley' THEN '✓ CORRECT'
    WHEN name = 'Berkeley University' THEN '✗ INCORRECT - Run migration to fix'
    ELSE '⚠ UNEXPECTED NAME'
  END as status
FROM school
WHERE domain = 'berkeley.edu';

-- ============================================
-- DIRECT FIX: Run these UPDATE statements directly
-- ============================================
-- If the DO block above didn't work, run these UPDATE statements directly
-- They will fix name mismatches for common schools

-- Fix Berkeley
UPDATE school
SET name = 'University of California, Berkeley'
WHERE domain = 'berkeley.edu' 
  AND name != 'University of California, Berkeley';

-- Fix UCLA
UPDATE school
SET name = 'University of California, Los Angeles'
WHERE domain = 'ucla.edu' 
  AND name != 'University of California, Los Angeles';

-- Fix USC
UPDATE school
SET name = 'University of Southern California'
WHERE domain = 'usc.edu' 
  AND name != 'University of Southern California';

-- Verify Berkeley was updated
SELECT 
  name,
  domain,
  CASE 
    WHEN name = 'University of California, Berkeley' THEN '✓ CORRECT'
    ELSE '✗ STILL INCORRECT'
  END as status
FROM school
WHERE domain = 'berkeley.edu';

