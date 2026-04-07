-- =============================================================================
-- Migration: 20240101000004_create_shift_templates
-- Description: Named, reusable shift definitions ("Apertura", "Chiusura", etc.)
--              that managers select when building the weekly schedule grid.
--              Seeds the two default templates referenced in the PRD.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.shift_templates (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  start_time   TIME        NOT NULL,
  end_time     TIME        NOT NULL,
  color        TEXT        NOT NULL DEFAULT '#22c55e',
  -- NULL means the template is global; non-NULL restricts it to one store
  workplace_id UUID        REFERENCES public.workplaces(id) ON DELETE SET NULL,
  created_by   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

COMMENT ON TABLE  public.shift_templates              IS 'Reusable named shift definitions selectable from the schedule grid popup.';
COMMENT ON COLUMN public.shift_templates.workplace_id IS 'NULL = available in all stores; set to restrict to a specific store.';
COMMENT ON COLUMN public.shift_templates.color        IS 'HEX background color shown in the shift cell (e.g. #bbf7d0 for Apertura).';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Templates are listed filtered by workplace and active status
CREATE INDEX IF NOT EXISTS idx_shift_templates_workplace_id ON public.shift_templates (workplace_id);
CREATE INDEX IF NOT EXISTS idx_shift_templates_created_by   ON public.shift_templates (created_by);
CREATE INDEX IF NOT EXISTS idx_shift_templates_is_active    ON public.shift_templates (is_active);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Note on seed data
-- ---------------------------------------------------------------------------
-- Default shift templates ("Apertura", "Chiusura") cannot be seeded here
-- because created_by requires a valid profiles.id which only exists after
-- the first manager user is created at runtime.
-- The application seed script (supabase/seed.sql) handles this instead.
