-- =============================================================================
-- Migration: 20240101000006_create_shifts
-- Description: Individual shift assignments. One row = one employee for one
--              calendar day. start_time/end_time are NULL for rest days.
--              Drives the "Chi sta lavorando ora" feature on the Home page.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.shifts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_week_id UUID        NOT NULL REFERENCES public.shift_weeks(id)    ON DELETE CASCADE,
  profile_id    UUID        NOT NULL REFERENCES public.profiles(id)        ON DELETE CASCADE,
  date          DATE        NOT NULL,
  start_time    TIME,                  -- NULL when is_rest_day = true
  end_time      TIME,                  -- NULL when is_rest_day = true
  shift_name    TEXT,                  -- e.g. 'Apertura', 'Chiusura', or custom
  workplace_id  UUID        REFERENCES public.workplaces(id) ON DELETE SET NULL,
  is_rest_day   BOOLEAN     NOT NULL DEFAULT false,
  template_id   UUID        REFERENCES public.shift_templates(id) ON DELETE SET NULL,
  notes         TEXT,
  created_by    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- A rest-day row must not carry time values
  CHECK (
    (is_rest_day = true  AND start_time IS NULL AND end_time IS NULL)
    OR
    (is_rest_day = false AND start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  ),
  -- One shift per employee per day per week
  UNIQUE (shift_week_id, profile_id, date)
);

COMMENT ON TABLE  public.shifts             IS 'Individual shift assignments: one row per employee per calendar day.';
COMMENT ON COLUMN public.shifts.is_rest_day IS 'When true, start_time and end_time must be NULL (rest/giorno di riposo).';
COMMENT ON COLUMN public.shifts.shift_name  IS 'Display name shown in the cell (may differ from template.name for custom shifts).';
COMMENT ON COLUMN public.shifts.created_by  IS 'Manager who created or last modified the shift.';

-- ---------------------------------------------------------------------------
-- Trigger: keep updated_at current
-- ---------------------------------------------------------------------------

CREATE OR REPLACE TRIGGER trg_shifts_updated_at
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- FK indexes (prevent heap fetches on every join)
CREATE INDEX IF NOT EXISTS idx_shifts_shift_week_id ON public.shifts (shift_week_id);
CREATE INDEX IF NOT EXISTS idx_shifts_profile_id    ON public.shifts (profile_id);
CREATE INDEX IF NOT EXISTS idx_shifts_workplace_id  ON public.shifts (workplace_id);
CREATE INDEX IF NOT EXISTS idx_shifts_template_id   ON public.shifts (template_id);
CREATE INDEX IF NOT EXISTS idx_shifts_created_by    ON public.shifts (created_by);

-- Composite index for the weekly grid query: fetch all shifts for a given week
-- ordered by date then employee — this is the most frequent query pattern.
CREATE INDEX IF NOT EXISTS idx_shifts_week_date
  ON public.shifts (shift_week_id, date, profile_id);

-- Index for "Chi sta lavorando ora" Home page feature:
-- WHERE date = today AND is_rest_day = false AND start_time <= now AND end_time >= now
CREATE INDEX IF NOT EXISTS idx_shifts_date_times
  ON public.shifts (date, start_time, end_time)
  WHERE is_rest_day = false;

-- Partial index: employees querying published shifts by date (read-only view)
CREATE INDEX IF NOT EXISTS idx_shifts_date_active
  ON public.shifts (date)
  INCLUDE (profile_id, workplace_id, shift_name, start_time, end_time, is_rest_day);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
