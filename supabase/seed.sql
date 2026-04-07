-- =============================================================================
-- seed.sql — Local development seed data only
-- Executed by: pnpm supabase db reset (local only, NEVER in production)
--
-- IMPORTANT: This file is NOT a migration. It is executed after all migrations
-- complete when running `supabase start` or `supabase db reset` locally.
-- It is never applied to Supabase Cloud production projects.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Prerequisite: pgcrypto for OTP trigger (already enabled in migration 00009,
-- repeated here for safety in case this is run in isolation)
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- OTP Deterministic Trigger for Playwright E2E Tests
--
-- For any auth.users row whose email ends with @example.com, sets
-- recovery_token to encode(digest(email || '123456', 'sha224'), 'hex').
--
-- This allows Playwright tests to calculate the OTP deterministically
-- without requiring SMTP / Mailpit:
--
--   const token = sha224(`${email}123456`); // hex encoded
--
-- Security: Lives in seed.sql (local-only). Never deployed to production.
-- In production, @example.com signups must be blocked via:
--   Supabase Dashboard → Authentication → Restrict signups → Blocked domains
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_deterministic_otp_for_test_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email ILIKE '%@example.com' THEN
    NEW.recovery_token := encode(
      digest(NEW.email || '123456', 'sha224'),
      'hex'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deterministic_otp ON auth.users;

CREATE TRIGGER trg_deterministic_otp
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_deterministic_otp_for_test_users();
