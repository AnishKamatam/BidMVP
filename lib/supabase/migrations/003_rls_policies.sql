-- Migration 003: Row Level Security (RLS) Policies
-- These policies control who can read/write data
-- CRITICAL for privacy and security
-- Run this in your Supabase SQL Editor after 002_missing_tables.sql

-- ============================================
-- Enable RLS on all tables
-- ============================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraternity ENABLE ROW LEVEL SECURITY;
ALTER TABLE event ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendship ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE report ENABLE ROW LEVEL SECURITY;
ALTER TABLE safetytier ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE rush_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- User table policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON "User";
DROP POLICY IF EXISTS "Users can update own profile" ON "User";
DROP POLICY IF EXISTS "Users can read basic profile info" ON "User";

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON "User" FOR SELECT
  USING (auth.uid()::TEXT = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON "User" FOR UPDATE
  USING (auth.uid()::TEXT = id);

-- Users can read basic info of others (name, year, profile_pic for friend system)
-- Full profile only visible to friends (enforced in application layer)
CREATE POLICY "Users can read basic profile info"
  ON "User" FOR SELECT
  USING (true); -- Public read for basic info, app layer filters sensitive data

-- ============================================
-- Fraternity table policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read fraternities" ON fraternity;
DROP POLICY IF EXISTS "Admins can update fraternity" ON fraternity;
DROP POLICY IF EXISTS "Authenticated users can create fraternities" ON fraternity;

-- Anyone can read fraternity info (public)
CREATE POLICY "Anyone can read fraternities"
  ON fraternity FOR SELECT
  USING (true);

-- Only group admins can update their fraternity
CREATE POLICY "Admins can update fraternity"
  ON fraternity FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = fraternity.id
      AND group_members.user_id = auth.uid()::TEXT
      AND group_members.role = 'admin'
    )
  );

-- Only authenticated users can create fraternities
CREATE POLICY "Authenticated users can create fraternities"
  ON fraternity FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- Group members table policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Members can read group members" ON group_members;
DROP POLICY IF EXISTS "Admins can manage members" ON group_members;

-- Create helper functions needed for group_members policies
-- These must be defined here before the policies that use them
-- SECURITY DEFINER functions bypass RLS to prevent infinite recursion
-- Drop existing functions first to allow parameter name changes

DROP FUNCTION IF EXISTS is_group_member(TEXT, TEXT);
DROP FUNCTION IF EXISTS is_group_admin(TEXT, TEXT);
DROP FUNCTION IF EXISTS group_has_members(TEXT);

-- Helper function to check if user is a member of a group
-- SECURITY DEFINER to bypass RLS and prevent infinite recursion
CREATE OR REPLACE FUNCTION is_group_member(p_group_id TEXT, p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
    AND user_id = p_user_id
  );
END;
$$;

-- Helper function to check if user is an admin of a group
-- SECURITY DEFINER to bypass RLS and prevent infinite recursion
CREATE OR REPLACE FUNCTION is_group_admin(p_user_id TEXT, p_group_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
    AND user_id = p_user_id
    AND role = 'admin'
  );
END;
$$;

-- Helper function to check if a group has any members
-- SECURITY DEFINER to bypass RLS and prevent infinite recursion
CREATE OR REPLACE FUNCTION group_has_members(p_group_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
  );
END;
$$;

-- Members can read their group's members
-- FIXED: Use SECURITY DEFINER function to avoid infinite recursion in RLS policy
CREATE POLICY "Members can read group members"
  ON group_members FOR SELECT
  USING (
    -- Allow if user is viewing their own membership record
    user_id = auth.uid()::TEXT
    -- OR if user is a member of the same group (using function to bypass RLS recursion)
    OR is_group_member(group_id, auth.uid()::TEXT)
  );

-- Only admins can add/remove members
-- FIXED: Use is_group_admin function to avoid infinite recursion
-- EXCEPTIONS: 
--   1. Allow fraternity creator to add themselves as first admin
--   2. Allow users to request to join (add themselves as member/pledge)
CREATE POLICY "Admins can manage members"
  ON group_members FOR ALL
  USING (
    is_group_admin(auth.uid()::TEXT, group_id)
  )
  WITH CHECK (
    -- Allow existing admins to add/update members
    is_group_admin(auth.uid()::TEXT, group_id)
    -- OR allow creator to add themselves as first admin (no members exist yet)
    OR (
      -- User is inserting themselves
      user_id = auth.uid()::TEXT
      -- And they're adding themselves as admin
      AND role = 'admin'
      -- And no members exist for this group yet (first member)
      -- Use SECURITY DEFINER function to check this without RLS recursion
      AND NOT group_has_members(group_id)
    )
    -- OR allow users to request to join (add themselves as member or pledge)
    OR (
      -- User is inserting themselves
      user_id = auth.uid()::TEXT
      -- And they're adding themselves as member or pledge (not admin)
      AND role IN ('member', 'pledge')
    )
  );

-- ============================================
-- Event table policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read events" ON event;
DROP POLICY IF EXISTS "Admins can manage events" ON event;

-- Anyone can read events (public feed)
CREATE POLICY "Anyone can read events"
  ON event FOR SELECT
  USING (true);

-- Only group admins can create/update events
CREATE POLICY "Admins can manage events"
  ON event FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = event.frat_id
      AND group_members.user_id = auth.uid()::TEXT
      AND group_members.role = 'admin'
    )
  );

-- ============================================
-- Checkin table policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own check-ins" ON checkin;
DROP POLICY IF EXISTS "Admins can read event check-ins" ON checkin;
DROP POLICY IF EXISTS "Admins can create check-ins" ON checkin;

-- Users can read their own check-ins
CREATE POLICY "Users can read own check-ins"
  ON checkin FOR SELECT
  USING (user_id = auth.uid()::TEXT);

-- Group admins can read all check-ins for their events
CREATE POLICY "Admins can read event check-ins"
  ON checkin FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event e
      JOIN group_members gm ON gm.group_id = e.frat_id
      WHERE e.id = checkin.event_id
      AND gm.user_id = auth.uid()::TEXT
      AND gm.role = 'admin'
    )
  );

-- Group admins can create check-ins (for QR scanning)
CREATE POLICY "Admins can create check-ins"
  ON checkin FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event e
      JOIN group_members gm ON gm.group_id = e.frat_id
      WHERE e.id = checkin.event_id
      AND gm.user_id = auth.uid()::TEXT
      AND gm.role = 'admin'
    )
  );

-- ============================================
-- Friendship table policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own friendships" ON friendship;
DROP POLICY IF EXISTS "Users can manage own friendships" ON friendship;

-- Users can read their own friendships
CREATE POLICY "Users can read own friendships"
  ON friendship FOR SELECT
  USING (user_id = auth.uid()::TEXT OR friend_id = auth.uid()::TEXT);

-- Users can create/update their own friendship requests
CREATE POLICY "Users can manage own friendships"
  ON friendship FOR ALL
  USING (user_id = auth.uid()::TEXT OR friend_id = auth.uid()::TEXT);

-- ============================================
-- Interaction table policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create interactions" ON interaction;
DROP POLICY IF EXISTS "Users can read own interactions" ON interaction;
DROP POLICY IF EXISTS "Admins can read all interactions" ON interaction;

-- Users can create interactions (upvotes/downvotes)
CREATE POLICY "Users can create interactions"
  ON interaction FOR INSERT
  WITH CHECK (from_user_id = auth.uid()::TEXT);

-- Users can read interactions they gave or received
CREATE POLICY "Users can read own interactions"
  ON interaction FOR SELECT
  USING (from_user_id = auth.uid()::TEXT OR to_user_id = auth.uid()::TEXT);

-- Group admins can read all interactions (for safety score visibility)
CREATE POLICY "Admins can read all interactions"
  ON interaction FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event e
      JOIN group_members gm ON gm.group_id = e.frat_id
      WHERE e.id = interaction.event_id
      AND gm.user_id = auth.uid()::TEXT
      AND gm.role = 'admin'
    )
  );

-- ============================================
-- Report table policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create reports" ON report;
DROP POLICY IF EXISTS "Users can read own reports" ON report;
DROP POLICY IF EXISTS "Admins can read all reports" ON report;

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON report FOR INSERT
  WITH CHECK (reporter_id = auth.uid()::TEXT);

-- Users can read their own reports
CREATE POLICY "Users can read own reports"
  ON report FOR SELECT
  USING (reporter_id = auth.uid()::TEXT);

-- Group admins can read all reports (for safety monitoring)
CREATE POLICY "Admins can read all reports"
  ON report FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event e
      JOIN group_members gm ON gm.group_id = e.frat_id
      WHERE e.id = report.event_id
      AND gm.user_id = auth.uid()::TEXT
      AND gm.role = 'admin'
    )
  );

-- ============================================
-- Safety tier table policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own safety tier" ON safetytier;
DROP POLICY IF EXISTS "Admins can read safety tiers" ON safetytier;

-- Users can read their own safety tier
CREATE POLICY "Users can read own safety tier"
  ON safetytier FOR SELECT
  USING (user_id = auth.uid()::TEXT);

-- HOST-ONLY: Group admins can read safety tiers (for filtering)
-- This is the key privacy feature - safety scores are host-only
CREATE POLICY "Admins can read safety tiers"
  ON safetytier FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.user_id = auth.uid()::TEXT
      AND group_members.role = 'admin'
    )
  );

-- Only system can update safety tiers (via functions/triggers)
-- Users cannot directly modify their safety tier

-- ============================================
-- Social links table policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage own social links" ON social_links;
DROP POLICY IF EXISTS "Anyone can read social links" ON social_links;

-- Users can manage their own social links
CREATE POLICY "Users can manage own social links"
  ON social_links FOR ALL
  USING (user_id = auth.uid()::TEXT);

-- Anyone can read social links (public profile info)
CREATE POLICY "Anyone can read social links"
  ON social_links FOR SELECT
  USING (true);

-- ============================================
-- Event requests table policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create event requests" ON event_requests;
DROP POLICY IF EXISTS "Users can read own requests" ON event_requests;
DROP POLICY IF EXISTS "Admins can manage event requests" ON event_requests;

-- Users can create their own event requests
CREATE POLICY "Users can create event requests"
  ON event_requests FOR INSERT
  WITH CHECK (user_id = auth.uid()::TEXT);

-- Users can read their own requests
CREATE POLICY "Users can read own requests"
  ON event_requests FOR SELECT
  USING (user_id = auth.uid()::TEXT);

-- Group admins can read/update requests for their events
CREATE POLICY "Admins can manage event requests"
  ON event_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM event e
      JOIN group_members gm ON gm.group_id = e.frat_id
      WHERE e.id = event_requests.event_id
      AND gm.user_id = auth.uid()::TEXT
      AND gm.role = 'admin'
    )
  );

-- ============================================
-- Event revenue table policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can read event revenue" ON event_revenue;

-- Group admins can read revenue for their events
CREATE POLICY "Admins can read event revenue"
  ON event_revenue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event e
      JOIN group_members gm ON gm.group_id = e.frat_id
      WHERE e.id = event_revenue.event_id
      AND gm.user_id = auth.uid()::TEXT
      AND gm.role = 'admin'
    )
  );

-- System can create revenue records (via payment processing)
-- Users cannot directly create revenue records

-- ============================================
-- Rush notes table policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Group members can read rush notes" ON rush_notes;
DROP POLICY IF EXISTS "Group members can manage rush notes" ON rush_notes;

-- Only group members can read rush notes for their group
CREATE POLICY "Group members can read rush notes"
  ON rush_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = rush_notes.group_id
      AND group_members.user_id = auth.uid()::TEXT
    )
  );

-- Group members can create/update rush notes
CREATE POLICY "Group members can manage rush notes"
  ON rush_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = rush_notes.group_id
      AND group_members.user_id = auth.uid()::TEXT
    )
  );

-- ============================================
-- Conversations table policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

-- Users can read their own conversations
CREATE POLICY "Users can read own conversations"
  ON conversations FOR SELECT
  USING (user1_id = auth.uid()::TEXT OR user2_id = auth.uid()::TEXT);

-- Users can create conversations
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (user1_id = auth.uid()::TEXT OR user2_id = auth.uid()::TEXT);

-- ============================================
-- Messages table policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own messages" ON messages;
DROP POLICY IF EXISTS "Users can create messages" ON messages;
DROP POLICY IF EXISTS "Users can update message read status" ON messages;

-- Users can read messages in their conversations
CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid()::TEXT OR conversations.user2_id = auth.uid()::TEXT)
    )
  );

-- Users can create messages in their conversations
CREATE POLICY "Users can create messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()::TEXT
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid()::TEXT OR conversations.user2_id = auth.uid()::TEXT)
    )
  );

-- Users can update read_at on messages they received
CREATE POLICY "Users can update message read status"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid()::TEXT OR conversations.user2_id = auth.uid()::TEXT)
      AND conversations.user1_id != messages.sender_id
      AND conversations.user2_id != messages.sender_id
    )
  );

-- ============================================
-- Message requests table policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read message requests" ON message_requests;
DROP POLICY IF EXISTS "Users can manage message requests" ON message_requests;

-- Users can read message requests for their conversations
CREATE POLICY "Users can read message requests"
  ON message_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = message_requests.conversation_id
      AND (conversations.user1_id = auth.uid()::TEXT OR conversations.user2_id = auth.uid()::TEXT)
    )
  );

-- Users can create/update message requests
CREATE POLICY "Users can manage message requests"
  ON message_requests FOR ALL
  USING (
    requester_id = auth.uid()::TEXT
    OR EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = message_requests.conversation_id
      AND (conversations.user1_id = auth.uid()::TEXT OR conversations.user2_id = auth.uid()::TEXT)
    )
  );

-- ============================================
-- Notes
-- ============================================
-- All policies use auth.uid() to get the current user's ID
-- RLS ensures data privacy - users can only see what they should
-- Safety tiers are HOST-ONLY (key differentiator)
-- Group admins have elevated permissions for their groups

