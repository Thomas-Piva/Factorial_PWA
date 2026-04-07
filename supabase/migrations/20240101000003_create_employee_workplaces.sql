-- =============================================================================
-- Migration: 20240101000003_create_employee_workplaces
-- Description: Many-to-many join table between profiles and workplaces.
--              Stores contract metadata per employee-per-store: type, status,
--              hire date, and weekly contracted hours (for overtime calculations).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.employee_workplaces (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID        NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,
  workplace_id    UUID        NOT NULL REFERENCES public.workplaces(id)  ON DELETE CASCADE,
  contract_type   TEXT        CHECK (contract_type IN ('voucher', 'dipendente', 'manager')),
  contract_status TEXT        NOT NULL DEFAULT 'in_corso'
                              CHECK (contract_status IN ('in_corso', 'terminato')),
  hired_at        DATE,
  -- Contracted weekly hours used for overtime / saldo calculations in the shift grid
  weekly_hours    NUMERIC(4,1) CHECK (weekly_hours >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, workplace_id)
);

COMMENT ON TABLE  public.employee_workplaces                IS 'Assigns employees to one or more stores with contract details.';
COMMENT ON COLUMN public.employee_workplaces.weekly_hours   IS 'Contracted weekly hours for ore-assegnate/ore-contrattuali display.';
COMMENT ON COLUMN public.employee_workplaces.contract_status IS 'in_corso = currently employed, terminato = former employee.';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- FK indexes prevent sequential scans on join queries
CREATE INDEX IF NOT EXISTS idx_emp_workplaces_profile_id   ON public.employee_workplaces (profile_id);
CREATE INDEX IF NOT EXISTS idx_emp_workplaces_workplace_id ON public.employee_workplaces (workplace_id);
-- Filter by contract status (active employees only)
CREATE INDEX IF NOT EXISTS idx_emp_workplaces_status       ON public.employee_workplaces (contract_status);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.employee_workplaces ENABLE ROW LEVEL SECURITY;
