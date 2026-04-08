import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { TodayShiftResult } from "@/lib/backend/home";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() })),
  usePathname: vi.fn(() => "/"),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeShift(overrides: Partial<TodayShiftResult> = {}): TodayShiftResult {
  return {
    id: "shift-1",
    shiftName: "Mattina",
    startTime: "08:00",
    endTime: "16:00",
    isRestDay: false,
    workplaceName: null,
    workplaceColor: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TodayShiftCard", () => {
  describe("when shift exists", () => {
    it("shows shift name and time range when shift exists", async () => {
      const { TodayShiftCard } = await import("./today-shift-card");
      const shift = makeShift({ shiftName: "Mattina", startTime: "08:00", endTime: "16:00" });

      render(<TodayShiftCard shift={shift} />);

      expect(screen.getByText(/Mattina/)).toBeInTheDocument();
      expect(screen.getByText(/08:00/)).toBeInTheDocument();
      expect(screen.getByText(/16:00/)).toBeInTheDocument();
    });

    it("shows workplace name when shift has a workplace", async () => {
      const { TodayShiftCard } = await import("./today-shift-card");
      const shift = makeShift({ workplaceName: "Sede Centrale" });

      render(<TodayShiftCard shift={shift} />);

      expect(screen.getByText(/Sede Centrale/)).toBeInTheDocument();
    });
  });

  describe("when shift is null", () => {
    it('shows "Nessun turno assegnato per oggi" when shift is null', async () => {
      const { TodayShiftCard } = await import("./today-shift-card");

      render(<TodayShiftCard shift={null} />);

      expect(
        screen.getByText(/Nessun turno assegnato per oggi/),
      ).toBeInTheDocument();
    });
  });

  describe("rest day", () => {
    it('shows "Giorno di riposo" when shift.isRestDay is true', async () => {
      const { TodayShiftCard } = await import("./today-shift-card");
      const shift = makeShift({ isRestDay: true });

      render(<TodayShiftCard shift={shift} />);

      expect(screen.getByText(/Giorno di riposo/)).toBeInTheDocument();
    });

    it("does not show time range when shift is a rest day", async () => {
      const { TodayShiftCard } = await import("./today-shift-card");
      const shift = makeShift({ isRestDay: true, startTime: "08:00", endTime: "16:00" });

      render(<TodayShiftCard shift={shift} />);

      expect(screen.queryByText(/08:00/)).not.toBeInTheDocument();
      expect(screen.queryByText(/16:00/)).not.toBeInTheDocument();
    });
  });
});
