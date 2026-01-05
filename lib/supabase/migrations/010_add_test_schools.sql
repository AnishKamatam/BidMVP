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

-- ============================================
-- MIGRATION: Add test schools
-- ============================================

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
        UPDATE school
        SET name = school_item[1]
        WHERE id = existing_id;
        updated_count := updated_count + 1;
        RAISE NOTICE 'Updated: % (%) [was: %]', school_item[1], school_item[2], existing_name;
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

