-- =============================================================================
-- Migration: 20240101000009_create_rls_policies
-- Description: Defines all Row Level Security policies and the is_manager()
--              helper function. Also revokes anon/public default privileges.
--              (OTP E2E trigger lives in supabase/seed.sql, not here.)
--
-- Design decisions:
--   - is_manager() uses SECURITY DEFINER so the sub-select bypasses RLS on
--     profiles itself, preventing infinite recursion.
--   - RLS policies use (SELECT auth.uid()) rather than auth.uid() directly.
--     This tells the planner to evaluate the expression once per query rather
--     than once per row, which is critical for tables with thousands of rows.
--   - Shifts visible to employees only when the parent shift_week is published
--     (join through shift_weeks.status).
--   - Absences: employees read only their own rows; managers read all.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Prerequisite: pgcrypto for OTP trigger
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Helper: is_manager()
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER + STABLE: evaluated once per statement, not per row.
-- Wrapped in (SELECT is_manager()) in policies to materialise it once.

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'manager'
  );
$$;

-- ---------------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------------

-- All authenticated users may list profiles (needed for "Persone" page)
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- A user may insert only their own profile row (covered by the signup trigger,
-- but kept as an explicit gate)
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

-- A user can update their own profile; managers can update any profile
DROP POLICY IF EXISTS "profiles_update_own_or_manager" ON public.profiles;
CREATE POLICY "profiles_update_own_or_manager"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (SELECT is_manager())
  )
  WITH CHECK (
    id = (SELECT auth.uid())
    OR (SELECT is_manager())
  );

-- Only managers may delete (soft-delete via is_active preferred)
DROP POLICY IF EXISTS "profiles_delete_manager" ON public.profiles;
CREATE POLICY "profiles_delete_manager"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING ((SELECT is_manager()));

-- ---------------------------------------------------------------------------
-- WORKPLACES
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "workplaces_select_authenticated" ON public.workplaces;
CREATE POLICY "workplaces_select_authenticated"
  ON public.workplaces
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "workplaces_insert_manager" ON public.workplaces;
CREATE POLICY "workplaces_insert_manager"
  ON public.workplaces
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_manager()));

DROP POLICY IF EXISTS "workplaces_update_manager" ON public.workplaces;
CREATE POLICY "workplaces_update_manager"
  ON public.workplaces
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_manager()))
  WITH CHECK ((SELECT is_manager()));

DROP POLICY IF EXISTS "workplaces_delete_manager" ON public.workplaces;
CREATE POLICY "workplaces_delete_manager"
  ON public.workplaces
  FOR DELETE
  TO authenticated
  USING ((SELECT is_manager()));

-- ---------------------------------------------------------------------------
-- EMPLOYEE_WORKPLACES
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "employee_workplaces_select_authenticated" ON public.employee_workplaces;
CREATE POLICY "employee_workplaces_select_authenticated"
  ON public.employee_workplaces
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "employee_workplaces_insert_manager" ON public.employee_workplaces;
CREATE POLICY "employee_workplaces_insert_manager"
  ON public.employee_workplaces
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_manager()));

DROP POLICY IF EXISTS "employee_workplaces_update_manager" ON public.employee_workplaces;
CREATE POLICY "employee_workplaces_update_manager"
  ON public.employee_workplaces
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_manager()))
  WITH CHECK ((SELECT is_manager()));

DROP POLICY IF EXISTS "employee_workplaces_delete_manager" ON public.employee_workplaces;
CREATE POLICY "employee_workplaces_delete_manager"
  ON public.employee_workplaces
  FOR DELETE
  TO authenticated
  USING ((SELECT is_manager()));

-- ---------------------------------------------------------------------------
-- SHIFT_TEMPLATES
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "shift_templates_select_authenticated" ON public.shift_templates;
CREATE POLICY "shift_templates_select_authenticated"
  ON public.shift_templates
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "shift_templates_insert_manager" ON public.shift_templates;
CREATE POLICY "shift_templates_insert_manager"
  ON public.shift_templates
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_manager()));

DROP POLICY IF EXISTS "shift_templates_update_manager" ON public.shift_templates;
CREATE POLICY "shift_templates_update_manager"
  ON public.shift_templates
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_manager()))
  WITH CHECK ((SELECT is_manager()));

DROP POLICY IF EXISTS "shift_templates_delete_manager" ON public.shift_templates;
CREATE POLICY "shift_templates_delete_manager"
  ON public.shift_templates
  FOR DELETE
  TO authenticated
  USING ((SELECT is_manager()));

-- ---------------------------------------------------------------------------
-- SHIFT_WEEKS
-- ---------------------------------------------------------------------------

-- Managers see all weeks (including drafts); employees see only published ones.
DROP POLICY IF EXISTS "shift_weeks_select_manager" ON public.shift_weeks;
CREATE POLICY "shift_weeks_select_manager"
  ON public.shift_weeks
  FOR SELECT
  TO authenticated
  USING (
    (SELECT is_manager())
    OR status = 'pubblicato'
  );

DROP POLICY IF EXISTS "shift_weeks_insert_manager" ON public.shift_weeks;
CREATE POLICY "shift_weeks_insert_manager"
  ON public.shift_weeks
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_manager()));

DROP POLICY IF EXISTS "shift_weeks_update_manager" ON public.shift_weeks;
CREATE POLICY "shift_weeks_update_manager"
  ON public.shift_weeks
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_manager()))
  WITH CHECK ((SELECT is_manager()));

DROP POLICY IF EXISTS "shift_weeks_delete_manager" ON public.shift_weeks;
CREATE POLICY "shift_weeks_delete_manager"
  ON public.shift_weeks
  FOR DELETE
  TO authenticated
  USING ((SELECT is_manager()));

-- ---------------------------------------------------------------------------
-- SHIFTS
-- ---------------------------------------------------------------------------

-- Managers see all shifts; employees only see shifts in published weeks.
-- The sub-select avoids a per-row function call.
DROP POLICY IF EXISTS "shifts_select" ON public.shifts;
CREATE POLICY "shifts_select"
  ON public.shifts
  FOR SELECT
  TO authenticated
  USING (
    (SELECT is_manager())
    OR EXISTS (
      SELECT 1 FROM public.shift_weeks sw
      WHERE sw.id = shift_week_id
        AND sw.status = 'pubblicato'
    )
  );

DROP POLICY IF EXISTS "shifts_insert_manager" ON public.shifts;
CREATE POLICY "shifts_insert_manager"
  ON public.shifts
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_manager()));

DROP POLICY IF EXISTS "shifts_update_manager" ON public.shifts;
CREATE POLICY "shifts_update_manager"
  ON public.shifts
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_manager()))
  WITH CHECK ((SELECT is_manager()));

DROP POLICY IF EXISTS "shifts_delete_manager" ON public.shifts;
CREATE POLICY "shifts_delete_manager"
  ON public.shifts
  FOR DELETE
  TO authenticated
  USING ((SELECT is_manager()));

-- ---------------------------------------------------------------------------
-- ABSENCE_TYPES
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "absence_types_select_authenticated" ON public.absence_types;
CREATE POLICY "absence_types_select_authenticated"
  ON public.absence_types
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "absence_types_insert_manager" ON public.absence_types;
CREATE POLICY "absence_types_insert_manager"
  ON public.absence_types
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_manager()));

DROP POLICY IF EXISTS "absence_types_update_manager" ON public.absence_types;
CREATE POLICY "absence_types_update_manager"
  ON public.absence_types
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_manager()))
  WITH CHECK ((SELECT is_manager()));

DROP POLICY IF EXISTS "absence_types_delete_manager" ON public.absence_types;
CREATE POLICY "absence_types_delete_manager"
  ON public.absence_types
  FOR DELETE
  TO authenticated
  USING ((SELECT is_manager()));

-- ---------------------------------------------------------------------------
-- ABSENCES
-- ---------------------------------------------------------------------------

-- Employees read only their own absences; managers read all.
DROP POLICY IF EXISTS "absences_select" ON public.absences;
CREATE POLICY "absences_select"
  ON public.absences
  FOR SELECT
  TO authenticated
  USING (
    profile_id = (SELECT auth.uid())
    OR (SELECT is_manager())
  );

-- Only managers may insert absences (no employee self-service in MVP).
DROP POLICY IF EXISTS "absences_insert_manager" ON public.absences;
CREATE POLICY "absences_insert_manager"
  ON public.absences
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_manager()));

-- Managers may update any absence; employees cannot update in MVP.
DROP POLICY IF EXISTS "absences_update_manager" ON public.absences;
CREATE POLICY "absences_update_manager"
  ON public.absences
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_manager()))
  WITH CHECK ((SELECT is_manager()));

-- Managers may delete any absence; employees cannot.
DROP POLICY IF EXISTS "absences_delete_manager" ON public.absences;
CREATE POLICY "absences_delete_manager"
  ON public.absences
  FOR DELETE
  TO authenticated
  USING ((SELECT is_manager()));

-- ---------------------------------------------------------------------------
-- Revoke public schema default privileges from anon and authenticated roles
-- (Supabase best practice: application never grants to PUBLIC)
-- ---------------------------------------------------------------------------

REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES  IN SCHEMA public FROM anon;

-- Prevent future tables (created by later migrations) from inheriting default
-- privileges for anon. Without this, every new table would be readable by anon
-- until an explicit REVOKE is applied. [H3 fix]
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES  FROM anon;

-- authenticated role gets only what RLS policies permit (SELECT/INSERT/UPDATE/DELETE
-- are already mediated by policies above; GRANT here is the minimum surface area)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.profiles,
     public.workplaces,
     public.employee_workplaces,
     public.shift_templates,
     public.shift_weeks,
     public.shifts,
     public.absence_types,
     public.absences
  TO authenticated;

-- NOTE: The deterministic OTP trigger for Playwright E2E tests has been
-- intentionally removed from this migration. It lives in supabase/seed.sql,
-- which is executed only in local development (supabase db reset) and never
-- applied to Supabase Cloud production projects. [C1 fix]
