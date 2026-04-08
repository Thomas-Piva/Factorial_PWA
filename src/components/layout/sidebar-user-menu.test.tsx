import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Profile } from "@/types";
import { SidebarUserMenu } from "./sidebar-user-menu";

// next/link mock — SidebarUserMenu may use Link for the "Preferenze" item.
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
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// next/navigation mock — guard against any router usage inside dependencies.
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() })),
  usePathname: vi.fn(() => "/"),
}));

// use-auth mock — SidebarUserMenu may internally call useAuth for signOut.
vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(() => ({
    signOut: vi.fn(),
  })),
}));

const mockProfile: Profile = {
  id: "user-1",
  email: "marco@example.com",
  first_name: "Marco",
  last_name: "Rossi",
  preferred_name: null,
  gender: null,
  phone: null,
  role: "dipendente",
  avatar_url: null,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("SidebarUserMenu", () => {
  it("renders the displayName text", () => {
    render(<SidebarUserMenu profile={mockProfile} displayName="Marco Rossi" />);

    expect(screen.getByText("Marco Rossi")).toBeInTheDocument();
  });

  it("renders avatar with the first letter of displayName as fallback", () => {
    render(<SidebarUserMenu profile={mockProfile} displayName="Marco Rossi" />);

    // AvatarFallback renders the first character "M"
    expect(screen.getByText("M")).toBeInTheDocument();
  });

  it("dropdown trigger is a button", () => {
    render(<SidebarUserMenu profile={mockProfile} displayName="Marco Rossi" />);

    // There must be at least one button that acts as the dropdown trigger
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});
