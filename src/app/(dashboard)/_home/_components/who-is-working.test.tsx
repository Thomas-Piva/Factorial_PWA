import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { WorkingNowEntry } from "@/lib/backend/home";

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

function makeEntry(overrides: Partial<WorkingNowEntry> = {}): WorkingNowEntry {
  return {
    profileId: "profile-1",
    firstName: "Marco",
    lastName: "Rossi",
    avatarUrl: null,
    startTime: "08:00",
    endTime: "16:00",
    workplaceName: "Sede Centrale",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("WhoIsWorking", () => {
  describe("title", () => {
    it('shows "Chi sta lavorando adesso" title', async () => {
      const { WhoIsWorking } = await import("./who-is-working");

      render(<WhoIsWorking initialData={[]} />);

      expect(screen.getByText(/Chi sta lavorando adesso/)).toBeInTheDocument();
    });
  });

  describe("employee list", () => {
    it("renders list of working employees with their names", async () => {
      const { WhoIsWorking } = await import("./who-is-working");
      const data = [
        makeEntry({ profileId: "p-1", firstName: "Marco", lastName: "Rossi" }),
        makeEntry({ profileId: "p-2", firstName: "Giulia", lastName: "Bianchi" }),
      ];

      render(<WhoIsWorking initialData={data} />);

      expect(screen.getByText(/Marco/)).toBeInTheDocument();
      expect(screen.getByText(/Rossi/)).toBeInTheDocument();
      expect(screen.getByText(/Giulia/)).toBeInTheDocument();
      expect(screen.getByText(/Bianchi/)).toBeInTheDocument();
    });

    it("shows time range for each employee", async () => {
      const { WhoIsWorking } = await import("./who-is-working");
      const data = [
        makeEntry({ profileId: "p-1", startTime: "08:00", endTime: "16:00" }),
        makeEntry({ profileId: "p-2", startTime: "14:00", endTime: "22:00" }),
      ];

      render(<WhoIsWorking initialData={data} />);

      expect(screen.getByText(/08:00/)).toBeInTheDocument();
      expect(screen.getByText(/16:00/)).toBeInTheDocument();
      expect(screen.getByText(/14:00/)).toBeInTheDocument();
      expect(screen.getByText(/22:00/)).toBeInTheDocument();
    });

    it("shows workplace name for each employee", async () => {
      const { WhoIsWorking } = await import("./who-is-working");
      const data = [
        makeEntry({ profileId: "p-1", workplaceName: "Sede Centrale" }),
        makeEntry({ profileId: "p-2", workplaceName: "Filiale Nord" }),
      ];

      render(<WhoIsWorking initialData={data} />);

      expect(screen.getByText(/Sede Centrale/)).toBeInTheDocument();
      expect(screen.getByText(/Filiale Nord/)).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it('shows "Nessun dipendente in turno al momento" when initialData is empty', async () => {
      const { WhoIsWorking } = await import("./who-is-working");

      render(<WhoIsWorking initialData={[]} />);

      expect(
        screen.getByText(/Nessun dipendente in turno al momento/),
      ).toBeInTheDocument();
    });
  });
});
