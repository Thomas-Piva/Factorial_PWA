-- =============================================================================
-- Migration: 20240101000007_create_absence_types
-- Description: Lookup table for absence categories (Ferie, Malattia, ROL,
--              Permesso, etc.). Seeded with the four types used in production.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.absence_types (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code       TEXT        NOT NULL UNIQUE,  -- machine-readable key: 'FERIE', 'MALATTIA', etc.
  label      TEXT        NOT NULL,          -- Italian display label shown in the UI
  color      TEXT        NOT NULL DEFAULT '#06b6d4',
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.absence_types       IS 'Lookup table of absence categories selectable when registering an absence.';
COMMENT ON COLUMN public.absence_types.code  IS 'Machine-readable uppercase code (FERIE, MALATTIA, ROL, PERMESSO).';
COMMENT ON COLUMN public.absence_types.label IS 'Italian display name shown in dropdowns and calendars.';
COMMENT ON COLUMN public.absence_types.color IS 'HEX color for calendar bar rendering.';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_absence_types_is_active ON public.absence_types (is_active);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.absence_types ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Seed: the four standard absence types
-- ---------------------------------------------------------------------------

INSERT INTO public.absence_types (code, label, color)
VALUES
  ('FERIE',    'Ferie',    '#06b6d4'),   -- cyan-500  — vacanza/ferie annuali
  ('MALATTIA', 'Malattia', '#ef4444'),   -- red-500   — malattia/congedo medico
  ('ROL',      'ROL',      '#f59e0b'),   -- amber-500 — riduzione orario di lavoro
  ('PERMESSO', 'Permesso', '#8b5cf6')    -- violet-500 — permesso generico
ON CONFLICT (code) DO NOTHING;
