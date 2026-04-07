-- =============================================================================
-- Migration: 20240101000011_enable_realtime
-- Description: Adds the three tables that need live updates to the Supabase
--              Realtime publication.
--
--              - shifts      : employees see their schedule update instantly
--                              when the manager publishes
--              - shift_weeks : status change (bozza -> pubblicato) triggers
--                              the "Pubblica" real-time notification
--              - absences    : calendar and shift grid reflect absences without
--                              a manual page refresh
--
-- How it works: Supabase Realtime uses a PostgreSQL publication named
-- "supabase_realtime". Adding tables here causes the WAL decoder to emit
-- change events that Supabase channels deliver to subscribed clients.
--
-- Client-side: each table subscription should respect the same RLS rules
-- (Supabase enforces them on the channel level when realtime RLS is enabled).
-- =============================================================================

-- supabase_realtime publication is created by the Supabase platform;
-- we only need to add our tables to it.
-- The DO block guards against running ALTER PUBLICATION on an already-added table.

DO $$
BEGIN
  -- shifts
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'shifts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shifts;
  END IF;

  -- shift_weeks
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'shift_weeks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_weeks;
  END IF;

  -- absences
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'absences'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.absences;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Note on REPLICA IDENTITY
-- Supabase Realtime requires REPLICA IDENTITY FULL on tables to emit the
-- full OLD row in UPDATE/DELETE events (needed for optimistic UI updates).
-- ---------------------------------------------------------------------------

ALTER TABLE public.shifts      REPLICA IDENTITY FULL;
ALTER TABLE public.shift_weeks REPLICA IDENTITY FULL;
ALTER TABLE public.absences    REPLICA IDENTITY FULL;
