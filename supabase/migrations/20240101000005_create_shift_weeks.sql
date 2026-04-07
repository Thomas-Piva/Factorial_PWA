-- =============================================================================
-- Migration: 20240101000005_create_shift_weeks
-- Description: Represents one week of scheduling with a draft/published status.
--              Each week is identified by its Monday date (week_start_date).
--              Employees only see shifts belonging to published weeks.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.shift_weeks (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_date  DATE        NOT NULL UNIQUE
                               CHECK (EXTRACT(ISODOW FROM week_start_date) = 1),  -- must be Monday
  status           TEXT        NOT NULL DEFAULT 'bozza'
                               CHECK (status IN ('bozza', 'pubblicato')),
  published_at     TIMESTAMPTZ,
  published_by     UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.shift_weeks                  IS 'One row per scheduling week. Employees only see shifts in published weeks.';
COMMENT ON COLUMN public.shift_weeks.week_start_date  IS 'Always the Monday of the week (ISO 8601 week start).';
COMMENT ON COLUMN public.shift_weeks.status           IS 'bozza = not yet visible to employees; pubblicato = visible to all.';
COMMENT ON COLUMN public.shift_weeks.published_at     IS 'Timestamp set when the manager clicks "Pubblica". Used for audit trail.';

-- ---------------------------------------------------------------------------
-- Trigger: keep updated_at current
-- ---------------------------------------------------------------------------

CREATE OR REPLACE TRIGGER trg_shift_weeks_updated_at
  BEFORE UPDATE ON public.shift_weeks
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Status is queried for every page load (employees filter to 'pubblicato')
CREATE INDEX IF NOT EXISTS idx_shift_weeks_status          ON public.shift_weeks (status);
-- published_by FK avoids sequential scan when joining to profiles
CREATE INDEX IF NOT EXISTS idx_shift_weeks_published_by    ON public.shift_weeks (published_by);
-- Descending index supports "most recent week first" navigation
CREATE INDEX IF NOT EXISTS idx_shift_weeks_week_start_desc ON public.shift_weeks (week_start_date DESC);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.shift_weeks ENABLE ROW LEVEL SECURITY;
