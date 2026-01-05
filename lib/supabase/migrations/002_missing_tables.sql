-- Migration 002: Create missing tables
-- These tables are needed for the full MVP functionality
-- Run this in your Supabase SQL Editor after 001_schema_extensions.sql

-- ============================================
-- 1. social_links table
-- ============================================
-- Stores social media links for user profiles
CREATE TABLE IF NOT EXISTS social_links (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'snapchat', 'vsco', 'tiktok')),
  username TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, platform) -- One link per platform per user
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_social_links_user_id ON social_links(user_id);

-- ============================================
-- 2. group_members table
-- ============================================
-- Manages fraternity/sorority membership and roles
CREATE TABLE IF NOT EXISTS group_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  group_id TEXT NOT NULL REFERENCES fraternity(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'pledge')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id) -- One membership per user per group
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members(role);

-- ============================================
-- 3. event_requests table
-- ============================================
-- Handles guest list requests (users requesting access to events)
CREATE TABLE IF NOT EXISTS event_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  event_id TEXT NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  UNIQUE(event_id, user_id) -- One request per user per event
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_event_requests_event_id ON event_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_event_requests_user_id ON event_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_event_requests_status ON event_requests(status);
CREATE INDEX IF NOT EXISTS idx_event_requests_pending ON event_requests(event_id, status) WHERE status = 'pending';

-- ============================================
-- 4. event_revenue table
-- ============================================
-- Tracks revenue from paid line skips, bids, etc.
CREATE TABLE IF NOT EXISTS event_revenue (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  event_id TEXT NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('line_skip', 'bid', 'priority_pass')),
  amount NUMERIC(10, 2) NOT NULL,
  stripe_session_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add stripe_session_id column if table already exists (for existing databases)
ALTER TABLE event_revenue 
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- Indexes for revenue queries
CREATE INDEX IF NOT EXISTS idx_event_revenue_event_id ON event_revenue(event_id);
CREATE INDEX IF NOT EXISTS idx_event_revenue_type ON event_revenue(type);
CREATE INDEX IF NOT EXISTS idx_event_revenue_created ON event_revenue(created_at);

-- Index for quick lookups by Stripe session ID (for webhook idempotency)
CREATE INDEX IF NOT EXISTS idx_event_revenue_stripe_session 
ON event_revenue(stripe_session_id) 
WHERE stripe_session_id IS NOT NULL;

-- Unique constraint to prevent duplicate webhook processing
-- This ensures each Stripe session is only recorded once
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_revenue_unique_session 
ON event_revenue(stripe_session_id) 
WHERE stripe_session_id IS NOT NULL;

-- ============================================
-- 5. rush_notes table
-- ============================================
-- Private notes frats keep about PNMs during rush
CREATE TABLE IF NOT EXISTS rush_notes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  group_id TEXT NOT NULL REFERENCES fraternity(id) ON DELETE CASCADE,
  pnm_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  category TEXT CHECK (category IN ('fun', 'solid', 'maybe', 'not_fit')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for rush queries
CREATE INDEX IF NOT EXISTS idx_rush_notes_group_id ON rush_notes(group_id);
CREATE INDEX IF NOT EXISTS idx_rush_notes_pnm_id ON rush_notes(pnm_id);
CREATE INDEX IF NOT EXISTS idx_rush_notes_category ON rush_notes(category);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_rush_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS rush_notes_updated_at ON rush_notes;
CREATE TRIGGER rush_notes_updated_at
  BEFORE UPDATE ON rush_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_rush_notes_updated_at();

-- ============================================
-- 6. conversations table (for chat system)
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user1_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  user2_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user1_id, user2_id) -- One conversation per user pair
);

-- Indexes for chat queries
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC NULLS LAST);

-- ============================================
-- 7. messages table (for chat system)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'reaction')),
  reaction_type TEXT CHECK (reaction_type IN ('thumbs_up', 'thumbs_down')),
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for message queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, read_at) WHERE read_at IS NULL;

-- ============================================
-- 8. message_requests table (for chat system)
-- ============================================
-- Handles message requests (like Instagram DMs)
CREATE TABLE IF NOT EXISTS message_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  requester_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(conversation_id, requester_id)
);

-- Indexes for message request queries
CREATE INDEX IF NOT EXISTS idx_message_requests_conversation ON message_requests(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_requests_requester ON message_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_message_requests_pending ON message_requests(status) WHERE status = 'pending';

-- ============================================
-- Comments
-- ============================================
-- All tables use TEXT for IDs to match your existing schema pattern
-- Foreign keys use ON DELETE CASCADE to maintain data integrity
-- Unique constraints prevent duplicate data
-- Indexes are added for performance on commonly queried fields

