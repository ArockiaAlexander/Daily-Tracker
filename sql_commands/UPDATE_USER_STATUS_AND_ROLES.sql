-- ============================================================
-- Migration: User Profile Status + Role rename (assistant_manager → manager)
-- Run this script in your Supabase SQL editor.
-- ============================================================

BEGIN;

-- 1. Create user_profile_status enum if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_profile_status') THEN
        CREATE TYPE public.user_profile_status AS ENUM ('active', 'idle', 'archive');
    END IF;
END
$$;

-- 2. Add status column to profiles table (defaults to 'active' for all existing users)
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS status public.user_profile_status NOT NULL DEFAULT 'active';

-- 3. Add 'manager' value to the existing user_role enum
--    (PostgreSQL does not allow dropping enum values, so we keep 'assistant_manager'
--     in the type but migrate all rows to 'manager')
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'manager';

-- 4. Migrate all existing assistant_manager rows → manager
UPDATE public.profiles
   SET role = 'manager'
 WHERE role::text = 'assistant_manager';

COMMIT;

-- ============================================================
-- Verification query (run separately to confirm)
-- ============================================================
-- SELECT role, status, COUNT(*) FROM public.profiles GROUP BY role, status ORDER BY role;
