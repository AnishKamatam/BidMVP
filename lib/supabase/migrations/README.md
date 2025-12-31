# Database Migrations

This directory contains SQL migration files to extend your existing Supabase database schema.

## Migration Order

Run these migrations in order in your Supabase SQL Editor:

1. **001_schema_extensions.sql** - Adds missing columns to existing tables
2. **002_missing_tables.sql** - Creates new tables needed for MVP
3. **003_rls_policies.sql** - Sets up Row Level Security policies
4. **004_functions.sql** - Creates database functions and triggers
5. **005_storage_setup.sql** - Sets up storage buckets for profile and fraternity photos
6. **009_create_school_table.sql** - Creates school table for campus detection
7. **010_add_test_schools.sql** - Adds test schools for development/testing (optional)
8. **011_fraternity_verification.sql** - Adds verification fields, member count tracking, and creator_id

## How to Run

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the contents of each migration file
4. Run them in order (001 → 002 → 003 → 004)
5. Check for any errors (they should all use `IF NOT EXISTS` to be safe)

## What Each Migration Does

### 001_schema_extensions.sql
- Adds `year`, `rushing`, `school_id` to `User` table
- Adds `description`, `event_type`, `end_time`, `visibility`, `qr_code` to `event` table
- Adds `type`, `photo_url`, `verified` to `fraternity` table
- Adds `checked_out_at`, `is_checked_in`, `entry_method` to `checkin` table
- Creates indexes for performance

### 002_missing_tables.sql
- Creates `social_links` table
- Creates `group_members` table
- Creates `event_requests` table
- Creates `event_revenue` table
- Creates `rush_notes` table
- Creates `conversations`, `messages`, `message_requests` tables (chat system)

### 003_rls_policies.sql
- Enables Row Level Security on all tables
- Sets up policies so:
  - Users can only see/edit their own data
  - Group admins can manage their group's data
  - Safety tiers are HOST-ONLY (key privacy feature)
  - Public data (events, basic profiles) is readable by all

### 004_functions.sql
- Creates `calculate_safety_score()` function
- Creates `assign_safety_tier()` function
- Creates `update_safety_score_and_tier()` function
- Creates triggers to auto-update safety scores
- Creates helper functions for event analytics

### 009_create_school_table.sql
- Creates `school` table for campus detection
- Links schools to email domains
- Sets up RLS policies for school table
- Backfills existing user school data

### 010_add_test_schools.sql
- Adds 30 common universities for testing
- Safe to run multiple times (skips existing schools)
- Useful for testing the campus search feature

### 011_fraternity_verification.sql
- Adds verification fields to fraternity table (email_verified, member_verified, etc.)
- Adds `creator_id` field to explicitly track who created each fraternity
- Creates fraternity_reports table for reporting fake/duplicate fraternities
- Adds triggers to auto-update member counts and verification status
- Backfills existing fraternities with their creator (first admin)

## Safety Notes

- All migrations use `IF NOT EXISTS` to prevent errors if run multiple times
- New columns are nullable to avoid breaking existing data
- Foreign keys use `ON DELETE CASCADE` to maintain data integrity
- RLS policies ensure data privacy

## Testing

After running migrations, test that:
1. You can still read/write to existing tables
2. New tables are accessible
3. RLS policies are working (try querying as different users)

## Rollback

If you need to rollback, you can:
1. Drop new tables: `DROP TABLE IF EXISTS table_name;`
2. Remove new columns: `ALTER TABLE table_name DROP COLUMN IF EXISTS column_name;`
3. Disable RLS: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`
4. Drop functions: `DROP FUNCTION IF EXISTS function_name;`

However, be careful - dropping tables will delete data!

