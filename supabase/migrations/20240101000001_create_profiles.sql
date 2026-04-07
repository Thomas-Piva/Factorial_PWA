-- =============================================================================
-- Migration: 20240101000001_create_profiles
-- Description: Creates the profiles table that extends auth.users with
--              application-level user data (name, role, avatar, contact info).
--              A trigger automatically creates a profile row on user signup.
-- =============================================================================

-- Helper function used by updated_at triggers across all tables.
-- Defined here so all subsequent migrations can rely on it.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email          TEXT        NOT NULL UNIQUE,
  first_name     TEXT        NOT NULL,
  last_name      TEXT        NOT NULL,
  preferred_name TEXT,
  phone          TEXT,
  gender         TEXT        CHECK (gender IN ('uomo', 'donna', 'altro')),
  role           TEXT        NOT NULL DEFAULT 'dipendente'
                             CHECK (role IN ('manager', 'dipendente')),
  avatar_url     TEXT,
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.profiles              IS 'Application user profiles. One row per auth.users entry.';
COMMENT ON COLUMN public.profiles.role         IS 'manager = titolare/responsabile, dipendente = commessa/addetto vendita';
COMMENT ON COLUMN public.profiles.is_active    IS 'Soft-delete flag. Inactive users cannot log in to the application.';

-- ---------------------------------------------------------------------------
-- Trigger: keep updated_at current
-- ---------------------------------------------------------------------------

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Trigger: auto-create profile row when a new auth user is inserted
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name',  ''),
    'dipendente'  -- role is always forced to 'dipendente' on signup; managers promote via UPDATE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop before recreate to ensure idempotency
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Email is used for login lookups and UNIQUE enforcement
CREATE INDEX IF NOT EXISTS idx_profiles_email     ON public.profiles (email);
-- Role is used in is_manager() and RLS policy evaluations
CREATE INDEX IF NOT EXISTS idx_profiles_role      ON public.profiles (role);
-- is_active is used in most queries that list staff
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles (is_active);

-- ---------------------------------------------------------------------------
-- RLS: enabled here; policies live in migration 00009
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
