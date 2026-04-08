import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { getGreetingByHour } from "@/lib/backend/home";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() })),
  usePathname: vi.fn(() => "/"),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GreetingCard", () => {
  describe("greeting text by hour", () => {
    it('shows "Buongiorno" greeting when hour is 8', async () => {
      const { GreetingCard } = await import("./greeting-card");

      render(
        <GreetingCard displayName="Marco Rossi" avatarUrl={null} hour={8} />,
      );

      expect(screen.getByText(new RegExp(getGreetingByHour(8)))).toBeInTheDocument();
    });

    it('shows "Buon pomeriggio" greeting when hour is 14', async () => {
      const { GreetingCard } = await import("./greeting-card");

      render(
        <GreetingCard displayName="Marco Rossi" avatarUrl={null} hour={14} />,
      );

      expect(screen.getByText(new RegExp(getGreetingByHour(14)))).toBeInTheDocument();
    });

    it('shows "Buonasera" greeting when hour is 20', async () => {
      const { GreetingCard } = await import("./greeting-card");

      render(
        <GreetingCard displayName="Marco Rossi" avatarUrl={null} hour={20} />,
      );

      expect(screen.getByText(new RegExp(getGreetingByHour(20)))).toBeInTheDocument();
    });
  });

  describe("displayName", () => {
    it("displays the displayName in the greeting text", async () => {
      const { GreetingCard } = await import("./greeting-card");

      render(
        <GreetingCard displayName="Giulia Bianchi" avatarUrl={null} hour={9} />,
      );

      expect(screen.getByText(/Giulia Bianchi/)).toBeInTheDocument();
    });
  });

  describe("avatar", () => {
    it("renders avatar fallback with the first letter of displayName when no avatarUrl", async () => {
      const { GreetingCard } = await import("./greeting-card");

      render(
        <GreetingCard displayName="Marco Rossi" avatarUrl={null} hour={10} />,
      );

      // Avatar fallback should show "M" — the first character of "Marco Rossi"
      expect(screen.getByText("M")).toBeInTheDocument();
    });
  });
});
