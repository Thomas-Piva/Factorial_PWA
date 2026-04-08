import { describe, it, expect, vi, type MockedFunction } from "vitest";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import type { Profile } from "@/types";
import { NAV_ITEMS } from "@/lib/constants";
import { Sidebar } from "./sidebar";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() })),
  usePathname: vi.fn(() => "/"),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className} role="link">
      {children}
    </a>
  ),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(() => ({
    signOut: vi.fn(),
  })),
}));

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const managerProfile: Profile = {
  id: "mgr-1",
  email: "anna@example.com",
  first_name: "Anna",
  last_name: "Bianchi",
  preferred_name: null,
  gender: null,
  phone: null,
  role: "manager",
  avatar_url: null,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const dipendenteProfile: Profile = {
  ...managerProfile,
  id: "emp-1",
  email: "luca@example.com",
  first_name: "Luca",
  last_name: "Verdi",
  role: "dipendente",
};

const mockUsePathname = usePathname as MockedFunction<typeof usePathname>;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Sidebar", () => {
  it("renders all 7 nav items when profile.role is 'manager'", () => {
    mockUsePathname.mockReturnValue("/");

    render(<Sidebar profile={managerProfile} displayName="Anna Bianchi" />);

    const totalNavItems = NAV_ITEMS.length; // 7
    NAV_ITEMS.forEach(({ label }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
    expect(screen.getAllByRole("link").length).toBeGreaterThanOrEqual(totalNavItems);
  });

  it("renders 6 nav items (hides 'Impostazioni') when profile.role is 'dipendente'", () => {
    mockUsePathname.mockReturnValue("/");

    render(<Sidebar profile={dipendenteProfile} displayName="Luca Verdi" />);

    expect(screen.queryByText("Impostazioni")).not.toBeInTheDocument();

    const visibleItems = NAV_ITEMS.filter((item) => !item.managerOnly);
    visibleItems.forEach(({ label }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("highlights the active nav item matching the current pathname", () => {
    mockUsePathname.mockReturnValue("/turni");

    render(<Sidebar profile={managerProfile} displayName="Anna Bianchi" />);

    // The link for /turni must carry an active style containing "bg-green"
    const turniLink = screen.getByRole("link", { name: /Turni/i });
    expect(turniLink.className).toMatch(/bg-green/);
  });

  it("does not highlight nav items that do not match the current pathname", () => {
    mockUsePathname.mockReturnValue("/turni");

    render(<Sidebar profile={managerProfile} displayName="Anna Bianchi" />);

    const homeLink = screen.getByRole("link", { name: /^Home$/i });
    expect(homeLink.className).not.toMatch(/bg-green/);
  });

  it("renders the displayName in the user menu area", () => {
    mockUsePathname.mockReturnValue("/");

    render(<Sidebar profile={managerProfile} displayName="Anna Bianchi" />);

    expect(screen.getByText("Anna Bianchi")).toBeInTheDocument();
  });

  it("has a nav element for accessibility", () => {
    mockUsePathname.mockReturnValue("/");

    render(<Sidebar profile={managerProfile} displayName="Anna Bianchi" />);

    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("renders 'Preferenze' bottom nav item", () => {
    mockUsePathname.mockReturnValue("/");

    render(<Sidebar profile={managerProfile} displayName="Anna Bianchi" />);

    expect(screen.getByText("Preferenze")).toBeInTheDocument();
  });
});
