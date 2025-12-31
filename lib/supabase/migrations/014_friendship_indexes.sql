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

CREATE OR REPLACE FUNCTION get_people_you_met(p_user_id TEXT, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  user_id TEXT,
  name TEXT,
  profile_pic TEXT,
  year INTEGER,
  shared_events_count BIGINT,
  last_event_date TIMESTAMP
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT 
    other_user.id as user_id,
    other_user.name,
    other_user.profile_pic,
    other_user.year,
    COUNT(DISTINCT shared_events.event_id)::BIGINT as shared_events_count,
    MAX(shared_events.checked_in_at) as last_event_date
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
  GROUP BY other_user.id, other_user.name, other_user.profile_pic, other_user.year
  ORDER BY shared_events_count DESC, last_event_date DESC
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
--   - Returns users who attended same events as the requesting user
--   - Excludes existing friends, pending requests, and blocked users
--   - Ranks by shared event count and recency
--   - Can be called from application code for better performance

