import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Profile } from "@/types";
import {
  getUserContext,
  type UserContext,
  type WorkplaceAssignment,
} from "./get-user-context";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_USER_ID = "user-abc-123";

const MOCK_PROFILE: Profile = {
  id: MOCK_USER_ID,
  email: "mario.rossi@example.com",
  first_name: "Mario",
  last_name: "Rossi",
  preferred_name: null,
  gender: "male",
  phone: null,
  role: "dipendente",
  avatar_url: null,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const MOCK_PROFILE_WITH_PREFERRED: Profile = {
  ...MOCK_PROFILE,
  preferred_name: "Marietto",
};

/** Raw rows returned by the employee_workplaces + workplaces join */
const MOCK_WORKPLACE_ROWS = [
  {
    id: "ew-1",
    contract_type: "full-time",
    contract_status: "active",
    weekly_hours: 40,
    hired_at: "2023-06-01",
    workplace_id: "wp-1",
    workplaces: { id: "wp-1", name: "Sede Centrale" },
  },
  {
    id: "ew-2",
    contract_type: null,
    contract_status: "inactive",
    weekly_hours: null,
    hired_at: null,
    workplace_id: "wp-2",
    workplaces: { id: "wp-2", name: "Filiale Nord" },
  },
];

const EXPECTED_ASSIGNMENTS: WorkplaceAssignment[] = [
  {
    id: "ew-1",
    workplaceId: "wp-1",
    workplaceName: "Sede Centrale",
    contractType: "full-time",
    contractStatus: "active",
    weeklyHours: 40,
    hiredAt: "2023-06-01",
  },
  {
    id: "ew-2",
    workplaceId: "wp-2",
    workplaceName: "Filiale Nord",
    contractType: null,
    contractStatus: "inactive",
    weeklyHours: null,
    hiredAt: null,
  },
];

// ---------------------------------------------------------------------------
// Mock builder
//
// Builds a minimal Supabase client mock. Each "chain" is an object whose
// terminal method returns a resolved promise. This lets callers override only
// the piece they care about without touching the rest.
// ---------------------------------------------------------------------------

type MockAuthGetUser =
  | { data: { user: { id: string } }; error: null }
  | { data: { user: null }; error: null }
  | { data: { user: null }; error: { message: string } };

type MockQueryResult<T> = { data: T | null; error: { message: string } | null };

interface BuildMockOptions {
  authResult?: MockAuthGetUser;
  profileResult?: MockQueryResult<Profile>;
  workplacesResult?: MockQueryResult<typeof MOCK_WORKPLACE_ROWS>;
}

function buildMockSupabase(opts: BuildMockOptions = {}) {
  const defaultAuth: MockAuthGetUser = {
    data: { user: { id: MOCK_USER_ID } },
    error: null,
  };
  const defaultProfile: MockQueryResult<Profile> = {
    data: MOCK_PROFILE,
    error: null,
  };
  const defaultWorkplaces: MockQueryResult<typeof MOCK_WORKPLACE_ROWS> = {
    data: MOCK_WORKPLACE_ROWS,
    error: null,
  };

  const authResult = opts.authResult ?? defaultAuth;
  const profileResult = opts.profileResult ?? defaultProfile;
  const workplacesResult = opts.workplacesResult ?? defaultWorkplaces;

  // Profiles chain: from("profiles").select("*").eq("id", userId).single()
  const profileSingle = vi.fn().mockResolvedValue(profileResult);
  const profileEq = vi.fn().mockReturnValue({ single: profileSingle });
  const profileSelect = vi.fn().mockReturnValue({ eq: profileEq });

  // Employee workplaces chain: from("employee_workplaces").select(...).eq("profile_id", userId)
  const workplacesEq = vi.fn().mockResolvedValue(workplacesResult);
  const workplacesSelect = vi.fn().mockReturnValue({ eq: workplacesEq });

  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "profiles") return { select: profileSelect };
    if (table === "employee_workplaces") return { select: workplacesSelect };
    throw new Error(`Unexpected table: ${table}`);
  });

  const getUser = vi.fn().mockResolvedValue(authResult);

  return {
    auth: { getUser },
    from,
    // Expose individual mocks for assertion purposes
    _mocks: { getUser, from, profileSelect, profileEq, profileSingle, workplacesSelect, workplacesEq },
  } as unknown as import("@supabase/supabase-js").SupabaseClient;
}

// ---------------------------------------------------------------------------
// 1. Auth failures — returns null
// ---------------------------------------------------------------------------

describe("getUserContext — auth failures", () => {
  it("returns null when getUser returns an auth error", async () => {
    const supabase = buildMockSupabase({
      authResult: {
        data: { user: null },
        error: { message: "jwt expired" },
      },
    });

    const result = await getUserContext(supabase);

    expect(result).toBeNull();
  });

  it("returns null when getUser returns a null user with no error", async () => {
    const supabase = buildMockSupabase({
      authResult: { data: { user: null }, error: null },
    });

    const result = await getUserContext(supabase);

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2. Profile fetch failures — returns null
// ---------------------------------------------------------------------------

describe("getUserContext — profile fetch failures", () => {
  it("returns null when profile query returns a DB error", async () => {
    const supabase = buildMockSupabase({
      profileResult: { data: null, error: { message: "relation does not exist" } },
    });

    const result = await getUserContext(supabase);

    expect(result).toBeNull();
  });

  it("returns null when profile query returns null data (profile not found)", async () => {
    const supabase = buildMockSupabase({
      profileResult: { data: null, error: null },
    });

    const result = await getUserContext(supabase);

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. Happy path — profile present, no workplaces
// ---------------------------------------------------------------------------

describe("getUserContext — happy path (no workplaces)", () => {
  it("returns a UserContext with the correct profile when user and profile exist", async () => {
    const supabase = buildMockSupabase({
      workplacesResult: { data: [], error: null },
    });

    const result = await getUserContext(supabase);

    expect(result).not.toBeNull();
    expect((result as UserContext).profile).toEqual(MOCK_PROFILE);
  });

  it("includes an empty workplaceAssignments array when the query returns no rows", async () => {
    const supabase = buildMockSupabase({
      workplacesResult: { data: [], error: null },
    });

    const result = await getUserContext(supabase);

    expect((result as UserContext).workplaceAssignments).toEqual([]);
  });

  it("sets primaryWorkplaceId to null when there are no workplace assignments", async () => {
    const supabase = buildMockSupabase({
      workplacesResult: { data: [], error: null },
    });

    const result = await getUserContext(supabase);

    expect((result as UserContext).primaryWorkplaceId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. displayName derivation
// ---------------------------------------------------------------------------

describe("getUserContext — displayName", () => {
  it("uses preferred_name as displayName when preferred_name is set", async () => {
    const supabase = buildMockSupabase({
      profileResult: { data: MOCK_PROFILE_WITH_PREFERRED, error: null },
      workplacesResult: { data: [], error: null },
    });

    const result = await getUserContext(supabase);

    expect((result as UserContext).displayName).toBe("Marietto");
  });

  it("falls back to first_name as displayName when preferred_name is null", async () => {
    const supabase = buildMockSupabase({
      profileResult: { data: MOCK_PROFILE, error: null }, // preferred_name is null
      workplacesResult: { data: [], error: null },
    });

    const result = await getUserContext(supabase);

    expect((result as UserContext).displayName).toBe("Mario");
  });
});

// ---------------------------------------------------------------------------
// 5. Workplace assignments mapping
// ---------------------------------------------------------------------------

describe("getUserContext — workplaceAssignments mapping", () => {
  it("maps DB rows to WorkplaceAssignment[] with correct camelCase fields", async () => {
    const supabase = buildMockSupabase();

    const result = await getUserContext(supabase);

    expect((result as UserContext).workplaceAssignments).toEqual(EXPECTED_ASSIGNMENTS);
  });

  it("maps nullable fields (contractType, weeklyHours, hiredAt) to null when absent", async () => {
    const supabase = buildMockSupabase();

    const result = await getUserContext(supabase);
    const second = (result as UserContext).workplaceAssignments[1];

    expect(second.contractType).toBeNull();
    expect(second.weeklyHours).toBeNull();
    expect(second.hiredAt).toBeNull();
  });

  it("derives workplaceName from the joined workplaces.name field", async () => {
    const supabase = buildMockSupabase();

    const result = await getUserContext(supabase);
    const first = (result as UserContext).workplaceAssignments[0];

    expect(first.workplaceName).toBe("Sede Centrale");
  });

  it("sets primaryWorkplaceId to the first assignment's workplaceId", async () => {
    const supabase = buildMockSupabase();

    const result = await getUserContext(supabase);

    expect((result as UserContext).primaryWorkplaceId).toBe("wp-1");
  });
});

// ---------------------------------------------------------------------------
// 6. Supabase query contract — verify correct tables and filters are used
// ---------------------------------------------------------------------------

describe("getUserContext — Supabase query contract", () => {
  it("calls supabase.auth.getUser() exactly once", async () => {
    const supabase = buildMockSupabase({
      workplacesResult: { data: [], error: null },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getUser = (supabase as any)._mocks.getUser as ReturnType<typeof vi.fn>;

    await getUserContext(supabase);

    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it("queries the profiles table with the authenticated user's id", async () => {
    const supabase = buildMockSupabase({
      workplacesResult: { data: [], error: null },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { profileEq } = (supabase as any)._mocks as {
      profileEq: ReturnType<typeof vi.fn>;
    };

    await getUserContext(supabase);

    expect(profileEq).toHaveBeenCalledWith("id", MOCK_USER_ID);
  });

  it("queries employee_workplaces filtered by profile_id", async () => {
    const supabase = buildMockSupabase({
      workplacesResult: { data: [], error: null },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { workplacesEq } = (supabase as any)._mocks as {
      workplacesEq: ReturnType<typeof vi.fn>;
    };

    await getUserContext(supabase);

    expect(workplacesEq).toHaveBeenCalledWith("profile_id", MOCK_USER_ID);
  });

  it("does not query the DB at all when auth returns no user", async () => {
    const supabase = buildMockSupabase({
      authResult: { data: { user: null }, error: null },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const from = (supabase as any)._mocks.from as ReturnType<typeof vi.fn>;

    await getUserContext(supabase);

    expect(from).not.toHaveBeenCalled();
  });
});
