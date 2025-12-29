-- Migration 001: Add missing columns to existing tables
-- This extends your existing schema without breaking anything
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Extend User table
-- ============================================

-- Add year column (1-5 for college years)
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS year INTEGER CHECK (year >= 1 AND year <= 5);

-- Add rushing toggle (for PNM visibility)
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS rushing BOOLEAN DEFAULT FALSE;

-- Add school_id as foreign key (optional - if migrating from text school field)
-- Note: This is nullable to allow gradual migration
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS school_id TEXT REFERENCES school(id);

-- Add index on school_id for faster queries
CREATE INDEX IF NOT EXISTS idx_user_school_id ON "User"(school_id);

-- Add index on rushing for PNM queries
CREATE INDEX IF NOT EXISTS idx_user_rushing ON "User"(rushing) WHERE rushing = TRUE;

-- ============================================
-- 2. Extend event table
-- ============================================

-- Add description field
ALTER TABLE event 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add event_type (party, mixer, rush, invite-only)
ALTER TABLE event 
ADD COLUMN IF NOT EXISTS event_type TEXT CHECK (event_type IN ('party', 'mixer', 'rush', 'invite-only'));

-- Add end_time (currently only has date/start_time)
ALTER TABLE event 
ADD COLUMN IF NOT EXISTS end_time TIMESTAMP;

-- Add visibility setting
ALTER TABLE event 
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'invite-only', 'rush-only'));

-- Add QR code field (unique per event)
ALTER TABLE event 
ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE;

-- Add index on event_type for filtering
CREATE INDEX IF NOT EXISTS idx_event_type ON event(event_type);

-- Add index on visibility for filtering
CREATE INDEX IF NOT EXISTS idx_event_visibility ON event(visibility);

-- ============================================
-- 3. Extend fraternity table
-- ============================================

-- Add type (fraternity, sorority, other)
ALTER TABLE fraternity 
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('fraternity', 'sorority', 'other'));

-- Add photo_url for group photos
ALTER TABLE fraternity 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add verified status (for manual verification)
ALTER TABLE fraternity 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- Add index on verified for filtering
CREATE INDEX IF NOT EXISTS idx_fraternity_verified ON fraternity(verified) WHERE verified = TRUE;

-- ============================================
-- 4. Extend checkin table
-- ============================================

-- Add checked_out_at timestamp
ALTER TABLE checkin 
ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMP;

-- Add is_checked_in boolean flag
ALTER TABLE checkin 
ADD COLUMN IF NOT EXISTS is_checked_in BOOLEAN DEFAULT TRUE;

-- Add entry_method (approved, qr_scan, manual)
ALTER TABLE checkin 
ADD COLUMN IF NOT EXISTS entry_method TEXT CHECK (entry_method IN ('approved', 'qr_scan', 'manual'));

-- Add index on is_checked_in for live attendee queries
CREATE INDEX IF NOT EXISTS idx_checkin_is_checked_in ON checkin(is_checked_in) WHERE is_checked_in = TRUE;

-- Add index on event_id + is_checked_in for event attendee queries
CREATE INDEX IF NOT EXISTS idx_checkin_event_checked ON checkin(event_id, is_checked_in);

-- ============================================
-- Comments for reference
-- ============================================
-- All columns are added with IF NOT EXISTS to prevent errors if run multiple times
-- All new columns are nullable (except where defaults are set) to avoid breaking existing data
-- Indexes are added for performance on commonly queried fields

