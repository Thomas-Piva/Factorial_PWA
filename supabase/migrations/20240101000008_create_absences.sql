-- =============================================================================
-- Migration: 20240101000008_create_absences
-- Description: Absence records created exclusively by managers on behalf of
--              employees. No employee self-request flow in MVP.
--              Absence rows propagate to the calendar and shift grid views
--              automatically via application-level queries.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.absences (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID        NOT NULL REFERENCES public.profiles(id)      ON DELETE CASCADE,
  absence_type_id UUID        NOT NULL REFERENCES public.absence_types(id) ON DELETE RESTRICT,
  start_date      DATE        NOT NULL,
  end_date        DATE        NOT NULL,
  notes           TEXT,
  -- Always the manager who registered the absence (no employee self-service in MVP)
  created_by      UUID        NOT NULL REFERENCES public.profiles(id)      ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (end_date >= start_date)
);

COMMENT ON TABLE  public.absences            IS 'Absence records. Managers insert these on behalf of employees.';
COMMENT ON COLUMN public.absences.profile_id IS 'The employee who is absent.';
COMMENT ON COLUMN public.absences.created_by IS 'Manager who registered the absence (always a manager in MVP).';

-- ---------------------------------------------------------------------------
-- Trigger: keep updated_at current
-- ---------------------------------------------------------------------------

CREATE OR REPLACE TRIGGER trg_absences_updated_at
  BEFORE UPDATE ON public.absences
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- FK indexes
CREATE INDEX IF NOT EXISTS idx_absences_profile_id      ON public.absences (profile_id);
CREATE INDEX IF NOT EXISTS idx_absences_absence_type_id ON public.absences (absence_type_id);
CREATE INDEX IF NOT EXISTS idx_absences_created_by      ON public.absences (created_by);

-- Date range queries: calendar view renders all absences within a month
-- Partial index includes the most selective columns for range lookups.
CREATE INDEX IF NOT EXISTS idx_absences_dates
  ON public.absences (start_date, end_date)
  INCLUDE (profile_id, absence_type_id);

-- Employee self-view: "show my absences ordered newest first"
CREATE INDEX IF NOT EXISTS idx_absences_profile_start_desc
  ON public.absences (profile_id, start_date DESC);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;
