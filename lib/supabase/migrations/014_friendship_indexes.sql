-- Migration 014: Add indexes for friendship queries and optional function for "People you met"
-- Run this in your Supabase SQL Editor after all previous migrations

-- ============================================
-- 1. Performance Indexes for Friendship Queries
-- ============================================

-- Index on (user_id, status) for fast friend list queries
CREATE INDEX IF NOT EXISTS idx_friendship_user_status 
ON friendship(user_id, status) 
WHERE status = 'accepted';

-- Index on (friend_id, status) for fast received requests queries
CREATE INDEX IF NOT EXISTS idx_friendship_friend_status 
ON friendship(friend_id, status) 
WHERE status = 'pending';

-- Index on (user_id, friend_id) for status checks (covered by UNIQUE constraint, but explicit index helps)
CREATE INDEX IF NOT EXISTS idx_friendship_user_friend 
ON friendship(user_id, friend_id);

-- Index on checkin table for "People you met" queries
-- Check if this exists from migration 001, if not add:
CREATE INDEX IF NOT EXISTS idx_checkin_user_event 
ON checkin(user_id, event_id) 
WHERE is_checked_in = TRUE;

-- ============================================
-- 2. Optional: Database Function for "People you met" query
-- ============================================
-- This function bypasses RLS with SECURITY DEFINER for better performance
-- Recommended approach for the getPeopleYouMet algorithm

CREATE OR REPLACE FUNCTION get_people_you_met(
  p_user_id TEXT, 
  p_limit INTEGER DEFAULT 20,
  p_user_school_id TEXT DEFAULT NULL,
  p_include_cross_school BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  user_id TEXT,
  name TEXT,
  profile_pic TEXT,
  year INTEGER,
  shared_events_count BIGINT,
  last_event_date TIMESTAMP,
  is_same_school BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH 
  -- Get all users from same school (excluding self, existing friendships)
  same_school_users AS (
    SELECT DISTINCT
      u.id as user_id,
      u.name,
      u.profile_pic,
      u.year,
      0::BIGINT as shared_events_count,
      NULL::TIMESTAMP as last_event_date,
      TRUE as is_same_school
    FROM "User" u
    WHERE u.school_id = p_user_school_id
      AND u.id != p_user_id
      AND p_user_school_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM friendship 
        WHERE (friendship.user_id = p_user_id AND friendship.friend_id = u.id)
           OR (friendship.user_id = u.id AND friendship.friend_id = p_user_id)
      )
  ),
  -- Get users who attended same events (existing logic)
  event_based_users AS (
    SELECT DISTINCT 
      other_user.id as user_id,
      other_user.name,
      other_user.profile_pic,
      other_user.year,
      COUNT(DISTINCT shared_events.event_id)::BIGINT as shared_events_count,
      NULL::TIMESTAMP as last_event_date,
      (other_user.school_id = p_user_school_id) as is_same_school
    FROM checkin user_checkins
    JOIN checkin other_checkins ON user_checkins.event_id = other_checkins.event_id
    JOIN "User" other_user ON other_checkins.user_id = other_user.id
    LEFT JOIN checkin shared_events ON (
      shared_events.user_id = p_user_id 
      AND shared_events.event_id = other_checkins.event_id
      AND (shared_events.is_checked_in = TRUE OR shared_events.checked_out_at IS NULL)
    )
    WHERE user_checkins.user_id = p_user_id
      AND other_checkins.user_id != p_user_id
      AND (other_checkins.is_checked_in = TRUE OR other_checkins.checked_out_at IS NULL)
      AND NOT EXISTS (
        SELECT 1 FROM friendship 
        WHERE (friendship.user_id = p_user_id AND friendship.friend_id = other_user.id)
           OR (friendship.user_id = other_user.id AND friendship.friend_id = p_user_id)
      )
      -- Filter by school if p_include_cross_school is false
      AND (p_include_cross_school = TRUE OR other_user.school_id = p_user_school_id OR p_user_school_id IS NULL)
    GROUP BY other_user.id, other_user.name, other_user.profile_pic, other_user.year, other_user.school_id
  ),
  -- Combine: use UNION to merge, then use DISTINCT ON to deduplicate (prefer event-based counts)
  all_users AS (
    SELECT * FROM event_based_users
    UNION
    SELECT * FROM same_school_users
  ),
  -- Deduplicate: prefer rows with higher event counts (event-based over same-school only)
  unique_users AS (
    SELECT DISTINCT ON (user_id)
      user_id,
      name,
      profile_pic,
      year,
      shared_events_count,
      last_event_date,
      is_same_school
    FROM all_users
    ORDER BY user_id, shared_events_count DESC, is_same_school DESC
  )
  SELECT 
    user_id,
    name,
    profile_pic,
    year,
    shared_events_count,
    last_event_date,
    is_same_school
  FROM unique_users
  -- Prioritize same-school users, then by shared events count
  ORDER BY is_same_school DESC, shared_events_count DESC, last_event_date DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- ============================================
-- Notes
-- ============================================
-- Indexes improve query performance for:
--   - Getting user's friends list
--   - Getting pending friend requests
--   - Checking friendship status between users
--   - Finding people who attended same events
--
-- The get_people_you_met function:
--   - Bypasses RLS with SECURITY DEFINER (needed to query checkin data)
--   - Returns users from same school (even without shared events) AND users who attended same events
--   - Includes users from the same school even if no shared events exist
--   - Deduplicates results (event-based data takes precedence when user appears in both)
--   - Prioritizes same-school users first, then by shared events count
--   - Excludes existing friends, pending requests, and blocked users
--   - Respects p_include_cross_school parameter for event-based suggestions
--   - Can be called from application code for better performance

