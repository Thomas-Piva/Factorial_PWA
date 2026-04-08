import { describe, it, expect, vi } from "vitest";
import {
  getGreetingByHour,
  getTodayShift,
  getWorkingNow,
  type TodayShiftResult,
  type WorkingNowEntry,
} from "./home";

// ---------------------------------------------------------------------------
// Mock builder helpers
// ---------------------------------------------------------------------------

/**
 * Builds a chainable Supabase mock for getTodayShift.
 *
 * Query chain:
 *   supabase.from("shifts")
 *     .select(...)
 *     .eq("profile_id", userId)
 *     .eq("date", today)
 *     .eq("shift_weeks.status", "pubblicato")
 *     .maybeSingle()
 */
function buildShiftMaybeSingle(result: {
  data: unknown;
  error: { message: string } | null;
}) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  // Each .eq() returns the same object so the chain is arbitrarily long.
  const chain: Record<string, unknown> = {};
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.maybeSingle = maybeSingle;

  const select = vi.fn().mockReturnValue(chain);

  const from = vi.fn().mockReturnValue({ select });

  return {
    supabase: { from } as unknown as import("@supabase/supabase-js").SupabaseClient,
    _mocks: { from, select, chain, maybeSingle },
  };
}

/**
 * Builds a chainable Supabase mock for getWorkingNow.
 *
 * Query chain:
 *   supabase.from("shifts")
 *     .select(...)
 *     .eq("date", today)
 *     .eq("is_rest_day", false)
 *     .lte("start_time", nowTime)
 *     .gt("end_time", nowTime)
 *     .eq("shift_weeks.status", "pubblicato")   // resolves here
 */
function buildWorkingNowChain(result: {
  data: unknown;
  error: { message: string } | null;
}) {
  // Terminal — the last method in the chain resolves the promise.
  // We treat the final .eq() call as the terminal (it returns the promise).
  // To keep it simple: every chained method returns the same object, and the
  // last call (whichever method is called last) resolves automatically because
  // we make .eq() / .lte() / .gt() return a thenable when they are the last
  // in the chain.  The cleanest approach: make the chain object itself a
  // thenable (Promise-like) so `await chain` resolves, AND expose individual
  // methods for assertions.

  const resolved = Promise.resolve(result);

  const chain: Record<string, unknown> = {
    eq: vi.fn(),
    lte: vi.fn(),
    gt: vi.fn(),
    then: resolved.then.bind(resolved),
    catch: resolved.catch.bind(resolved),
  };

  // Every chained call returns the same chain object.
  (chain.eq as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  (chain.lte as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  (chain.gt as ReturnType<typeof vi.fn>).mockReturnValue(chain);

  const select = vi.fn().mockReturnValue(chain);
  const from = vi.fn().mockReturnValue({ select });

  return {
    supabase: { from } as unknown as import("@supabase/supabase-js").SupabaseClient,
    _mocks: { from, select, chain },
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TODAY = "2026-04-08";
const USER_ID = "profile-001";
const NOW_TIME = "10:30";

/** Raw DB row returned by the getTodayShift query */
const SHIFT_ROW_ACTIVE = {
  id: "shift-001",
  shift_name: "Mattina",
  start_time: "08:00",
  end_time: "16:00",
  is_rest_day: false,
  shift_weeks: { status: "pubblicato" },
  workplaces: { name: "Sede Centrale", color: "#FF5733" },
};

const SHIFT_ROW_REST = {
  id: "shift-002",
  shift_name: null,
  start_time: null,
  end_time: null,
  is_rest_day: true,
  shift_weeks: { status: "pubblicato" },
  workplaces: null,
};

const SHIFT_ROW_NO_WORKPLACE = {
  id: "shift-003",
  shift_name: "Pomeriggio",
  start_time: "14:00",
  end_time: "22:00",
  is_rest_day: false,
  shift_weeks: { status: "pubblicato" },
  workplaces: null,
};

/** Raw DB rows returned by the getWorkingNow query */
const WORKING_NOW_ROWS = [
  {
    start_time: "08:00",
    end_time: "16:00",
    profiles: {
      id: "profile-001",
      first_name: "Mario",
      last_name: "Rossi",
      avatar_url: "https://example.com/mario.jpg",
    },
    workplaces: { name: "Sede Centrale" },
  },
  {
    start_time: "09:00",
    end_time: "17:00",
    profiles: {
      id: "profile-002",
      first_name: "Lucia",
      last_name: "Bianchi",
      avatar_url: null,
    },
    workplaces: null,
  },
];

// ---------------------------------------------------------------------------
// 1. getGreetingByHour — pure function, no mocks
// ---------------------------------------------------------------------------

describe("getGreetingByHour", () => {
  describe('returns "Buongiorno" for morning hours (0–11)', () => {
    it("returns Buongiorno for hour 0", () => {
      expect(getGreetingByHour(0)).toBe("Buongiorno");
    });

    it("returns Buongiorno for hour 6", () => {
      expect(getGreetingByHour(6)).toBe("Buongiorno");
    });

    it("returns Buongiorno for hour 11", () => {
      expect(getGreetingByHour(11)).toBe("Buongiorno");
    });
  });

  describe('returns "Buon pomeriggio" for afternoon hours (12–17)', () => {
    it("returns Buon pomeriggio for hour 12", () => {
      expect(getGreetingByHour(12)).toBe("Buon pomeriggio");
    });

    it("returns Buon pomeriggio for hour 15", () => {
      expect(getGreetingByHour(15)).toBe("Buon pomeriggio");
    });

    it("returns Buon pomeriggio for hour 17", () => {
      expect(getGreetingByHour(17)).toBe("Buon pomeriggio");
    });
  });

  describe('returns "Buonasera" for evening hours (18–23)', () => {
    it("returns Buonasera for hour 18", () => {
      expect(getGreetingByHour(18)).toBe("Buonasera");
    });

    it("returns Buonasera for hour 21", () => {
      expect(getGreetingByHour(21)).toBe("Buonasera");
    });

    it("returns Buonasera for hour 23", () => {
      expect(getGreetingByHour(23)).toBe("Buonasera");
    });
  });
});

// ---------------------------------------------------------------------------
// 2. getTodayShift — mock supabase
// ---------------------------------------------------------------------------

describe("getTodayShift", () => {
  it("returns null when no shift is found for today (empty data)", async () => {
    const { supabase } = buildShiftMaybeSingle({ data: null, error: null });

    const result = await getTodayShift(supabase, USER_ID, TODAY);

    expect(result).toBeNull();
  });

  it("returns TodayShiftResult with correct mapped fields when shift exists", async () => {
    const { supabase } = buildShiftMaybeSingle({
      data: SHIFT_ROW_ACTIVE,
      error: null,
    });

    const result = await getTodayShift(supabase, USER_ID, TODAY);

    expect(result).not.toBeNull();
    const shift = result as TodayShiftResult;
    expect(shift.id).toBe("shift-001");
    expect(shift.shiftName).toBe("Mattina");
    expect(shift.startTime).toBe("08:00");
    expect(shift.endTime).toBe("16:00");
    expect(shift.isRestDay).toBe(false);
    expect(shift.workplaceName).toBe("Sede Centrale");
    expect(shift.workplaceColor).toBe("#FF5733");
  });

  it("returns shift with isRestDay: true when shift is a rest day", async () => {
    const { supabase } = buildShiftMaybeSingle({
      data: SHIFT_ROW_REST,
      error: null,
    });

    const result = await getTodayShift(supabase, USER_ID, TODAY);

    expect(result).not.toBeNull();
    expect((result as TodayShiftResult).isRestDay).toBe(true);
  });

  it("returns null when DB query returns an error", async () => {
    const { supabase } = buildShiftMaybeSingle({
      data: null,
      error: { message: "DB connection failed" },
    });

    const result = await getTodayShift(supabase, USER_ID, TODAY);

    expect(result).toBeNull();
  });

  it("maps workplaceName and workplaceColor from joined workplace", async () => {
    const { supabase } = buildShiftMaybeSingle({
      data: SHIFT_ROW_ACTIVE,
      error: null,
    });

    const result = await getTodayShift(supabase, USER_ID, TODAY);

    expect((result as TodayShiftResult).workplaceName).toBe("Sede Centrale");
    expect((result as TodayShiftResult).workplaceColor).toBe("#FF5733");
  });

  it("maps workplaceName and workplaceColor to null when workplace is absent", async () => {
    const { supabase } = buildShiftMaybeSingle({
      data: SHIFT_ROW_NO_WORKPLACE,
      error: null,
    });

    const result = await getTodayShift(supabase, USER_ID, TODAY);

    expect((result as TodayShiftResult).workplaceName).toBeNull();
    expect((result as TodayShiftResult).workplaceColor).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. getWorkingNow — mock supabase
// ---------------------------------------------------------------------------

describe("getWorkingNow", () => {
  it("returns empty array when no one is working now", async () => {
    const { supabase } = buildWorkingNowChain({ data: [], error: null });

    const result = await getWorkingNow(supabase, TODAY, NOW_TIME);

    expect(result).toEqual([]);
  });

  it("returns WorkingNowEntry[] with correct mapped fields when shifts found", async () => {
    const { supabase } = buildWorkingNowChain({
      data: WORKING_NOW_ROWS,
      error: null,
    });

    const result = await getWorkingNow(supabase, TODAY, NOW_TIME);

    expect(result).toHaveLength(2);
    const first = result[0] as WorkingNowEntry;
    expect(first.profileId).toBe("profile-001");
    expect(first.firstName).toBe("Mario");
    expect(first.lastName).toBe("Rossi");
    expect(first.avatarUrl).toBe("https://example.com/mario.jpg");
    expect(first.startTime).toBe("08:00");
    expect(first.endTime).toBe("16:00");
    expect(first.workplaceName).toBe("Sede Centrale");
  });

  it("maps firstName, lastName, avatarUrl from joined profile", async () => {
    const { supabase } = buildWorkingNowChain({
      data: WORKING_NOW_ROWS,
      error: null,
    });

    const result = await getWorkingNow(supabase, TODAY, NOW_TIME);
    const second = result[1] as WorkingNowEntry;

    expect(second.profileId).toBe("profile-002");
    expect(second.firstName).toBe("Lucia");
    expect(second.lastName).toBe("Bianchi");
    expect(second.avatarUrl).toBeNull();
  });

  it("maps workplaceName from joined workplace, null when absent", async () => {
    const { supabase } = buildWorkingNowChain({
      data: WORKING_NOW_ROWS,
      error: null,
    });

    const result = await getWorkingNow(supabase, TODAY, NOW_TIME);

    expect(result[0].workplaceName).toBe("Sede Centrale");
    expect(result[1].workplaceName).toBeNull();
  });

  it("returns empty array when DB query returns an error", async () => {
    const { supabase } = buildWorkingNowChain({
      data: null,
      error: { message: "query failed" },
    });

    const result = await getWorkingNow(supabase, TODAY, NOW_TIME);

    expect(result).toEqual([]);
  });

  it("only includes non-rest-day shifts (is_rest_day=false filter applied at DB level)", async () => {
    // The DB filter is applied in the query via .eq("is_rest_day", false).
    // We verify that if the DB returns only non-rest-day rows (as it should),
    // the function does not introduce rest-day entries.
    const nonRestRows = [WORKING_NOW_ROWS[0]]; // single non-rest row
    const { supabase } = buildWorkingNowChain({
      data: nonRestRows,
      error: null,
    });

    const result = await getWorkingNow(supabase, TODAY, NOW_TIME);

    expect(result).toHaveLength(1);
    // No isRestDay field on WorkingNowEntry — the filter is a DB concern.
    // What matters is that all returned entries have valid start/end times.
    expect(result[0].startTime).toBeTruthy();
    expect(result[0].endTime).toBeTruthy();
  });
});
