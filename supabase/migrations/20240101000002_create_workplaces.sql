-- =============================================================================
-- Migration: 20240101000002_create_workplaces
-- Description: Creates the workplaces table representing the two store
--              locations (Dr Taffi, L'ERBOLARIO).
--              Seeds the two real stores from constants.ts / PRD.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.workplaces (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL UNIQUE,
  address    TEXT,
  color      TEXT,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.workplaces           IS 'Physical store locations. Currently: Dr Taffi, L''ERBOLARIO.';
COMMENT ON COLUMN public.workplaces.color     IS 'HEX color code used to distinguish the store in the UI.';
COMMENT ON COLUMN public.workplaces.is_active IS 'Soft-delete flag.';

-- ---------------------------------------------------------------------------
-- Trigger: keep updated_at current
-- ---------------------------------------------------------------------------

CREATE OR REPLACE TRIGGER trg_workplaces_updated_at
  BEFORE UPDATE ON public.workplaces
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Frequently filtered by in shift grids and calendars
CREATE INDEX IF NOT EXISTS idx_workplaces_is_active ON public.workplaces (is_active);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.workplaces ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Seed: the two real stores (idempotent via ON CONFLICT)
-- ---------------------------------------------------------------------------

INSERT INTO public.workplaces (name, address, color)
VALUES
  ('Dr Taffi',     NULL, '#16a34a'),   -- verde primario dell''app
  ('L''ERBOLARIO', NULL, '#06b6d4')    -- turchese / cyan-500
ON CONFLICT (name) DO NOTHING;
