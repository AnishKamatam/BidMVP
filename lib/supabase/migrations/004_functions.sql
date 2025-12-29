--Migration 004: Database Functions
-- These functions handle business logic at the database level
-- Run this in your Supabase SQL Editor after 003_rls_policies.sql

-- ============================================
-- 1. Calculate Safety Score Function
-- ============================================
-- This function calculates a user's safety score based on interactions and reports
-- Called automatically when interactions/reports are created

CREATE OR REPLACE FUNCTION calculate_safety_score(target_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  base_score INTEGER := 50; -- Neutral starting point
  upvote_points INTEGER := 0;
  downvote_points INTEGER := 0;
  report_penalty INTEGER := 0;
  final_score INTEGER;
BEGIN
  -- Count upvotes (positive interactions)
  SELECT COALESCE(COUNT(*) * 5, 0) INTO upvote_points
  FROM interaction
  WHERE to_user_id = target_user_id
  AND type = 'upvote'
  AND timestamp > NOW() - INTERVAL '90 days'; -- Recent interactions weighted

  -- Count downvotes (negative interactions)
  SELECT COALESCE(COUNT(*) * -10, 0) INTO downvote_points
  FROM interaction
  WHERE to_user_id = target_user_id
  AND type = 'downvote'
  AND timestamp > NOW() - INTERVAL '90 days';

  -- Count reports (weighted by severity)
  SELECT COALESCE(SUM(severity * -20), 0) INTO report_penalty
  FROM report
  WHERE reported_user_id = target_user_id
  AND timestamp > NOW() - INTERVAL '90 days';

  -- Calculate final score
  final_score := base_score + upvote_points + downvote_points + report_penalty;

  -- Clamp score between 0 and 100
  IF final_score > 100 THEN
    final_score := 100;
  ELSIF final_score < 0 THEN
    final_score := 0;
  END IF;

  RETURN final_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Assign Safety Tier Function
-- ============================================
-- Converts safety score (0-100) to tier (G1-G3, Y1-Y3, R1-R3)

CREATE OR REPLACE FUNCTION assign_safety_tier(score INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF score >= 80 THEN
    -- Green tier (G1-G3)
    IF score >= 95 THEN
      RETURN 'G1';
    ELSIF score >= 88 THEN
      RETURN 'G2';
    ELSE
      RETURN 'G3';
    END IF;
  ELSIF score >= 50 THEN
    -- Yellow tier (Y1-Y3)
    IF score >= 70 THEN
      RETURN 'Y1';
    ELSIF score >= 60 THEN
      RETURN 'Y2';
    ELSE
      RETURN 'Y3';
    END IF;
  ELSE
    -- Red tier (R1-R3)
    IF score >= 30 THEN
      RETURN 'R1';
    ELSIF score >= 15 THEN
      RETURN 'R2';
    ELSE
      RETURN 'R3';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 3. Update Safety Score and Tier Function
-- ============================================
-- Main function to update both User.safety_score and safetytier table

CREATE OR REPLACE FUNCTION update_safety_score_and_tier(target_user_id TEXT)
RETURNS VOID AS $$
DECLARE
  calculated_score INTEGER;
  assigned_tier TEXT;
BEGIN
  -- Calculate new score
  calculated_score := calculate_safety_score(target_user_id);
  
  -- Assign tier
  assigned_tier := assign_safety_tier(calculated_score);

  -- Update User table
  UPDATE "User"
  SET safety_score = calculated_score
  WHERE id = target_user_id;

  -- Update or insert safety tier
  INSERT INTO safetytier (user_id, tier, last_computed)
  VALUES (target_user_id, assigned_tier, CURRENT_TIMESTAMP)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    tier = assigned_tier,
    last_computed = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Check Group Admin Function
-- ============================================
-- Helper function to check if a user is an admin of a group
-- Used in RLS policies and application logic

CREATE OR REPLACE FUNCTION is_group_admin(user_id TEXT, group_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = is_group_admin.group_id
    AND group_members.user_id = is_group_admin.user_id
    AND group_members.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 5. Trigger: Auto-update safety score on interaction
-- ============================================
-- Automatically recalculates safety score when interaction is created

CREATE OR REPLACE FUNCTION trigger_update_safety_on_interaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Update safety score for the user who received the interaction
  PERFORM update_safety_score_and_tier(NEW.to_user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_safety_on_interaction
  AFTER INSERT ON interaction
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_safety_on_interaction();

-- ============================================
-- 6. Trigger: Auto-update safety score on report
-- ============================================
-- Automatically recalculates safety score when report is created

CREATE OR REPLACE FUNCTION trigger_update_safety_on_report()
RETURNS TRIGGER AS $$
BEGIN
  -- Update safety score for the user who was reported
  PERFORM update_safety_score_and_tier(NEW.reported_user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_safety_on_report
  AFTER INSERT ON report
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_safety_on_report();

-- ============================================
-- 7. Function: Get Event Attendee Count
-- ============================================
-- Returns count of currently checked-in attendees

CREATE OR REPLACE FUNCTION get_event_attendee_count(event_id TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM checkin
    WHERE checkin.event_id = get_event_attendee_count.event_id
    AND is_checked_in = TRUE
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 8. Function: Get Event Ratio
-- ============================================
-- Returns M/F/X ratio for an event (for live dashboard)

CREATE OR REPLACE FUNCTION get_event_ratio(event_id TEXT)
RETURNS TABLE (
  gender TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.gender,
    COUNT(*)::BIGINT
  FROM checkin c
  JOIN "User" u ON u.id = c.user_id
  WHERE c.event_id = get_event_ratio.event_id
  AND c.is_checked_in = TRUE
  GROUP BY u.gender;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 9. Function: Check Report Cooldown
-- ============================================
-- Returns true if user can report (hasn't exceeded 2 reports per week)

CREATE OR REPLACE FUNCTION can_user_report(user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  report_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO report_count
  FROM report
  WHERE reporter_id = can_user_report.user_id
  AND timestamp > NOW() - INTERVAL '7 days';

  RETURN report_count < 2;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- Notes
-- ============================================
-- SECURITY DEFINER functions run with elevated privileges (needed for updates)
-- STABLE functions can be optimized (results don't change within a transaction)
-- IMMUTABLE functions always return same result for same input
-- Triggers automatically update safety scores when interactions/reports are created

