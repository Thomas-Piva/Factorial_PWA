import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Home } from "lucide-react";
import type { NavItem } from "@/lib/constants";
import { SidebarNavItem } from "./sidebar-nav-item";

// next/link is used internally by SidebarNavItem — mock it so tests run
// without a full Next.js router context.
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

const homeItem: NavItem = {
  href: "/",
  label: "Home",
  icon: Home,
};

describe("SidebarNavItem", () => {
  it("renders a link with the correct href", () => {
    render(<SidebarNavItem item={homeItem} isActive={false} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders the label text", () => {
    render(<SidebarNavItem item={homeItem} isActive={false} />);

    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("applies active styles (contains 'bg-green' class) when isActive is true", () => {
    render(<SidebarNavItem item={homeItem} isActive={true} />);

    const link = screen.getByRole("link");
    expect(link.className).toMatch(/bg-green/);
  });

  it("does not apply active styles when isActive is false", () => {
    render(<SidebarNavItem item={homeItem} isActive={false} />);

    const link = screen.getByRole("link");
    expect(link.className).not.toMatch(/bg-green/);
  });

  it("link has accessible role='link'", () => {
    render(<SidebarNavItem item={homeItem} isActive={false} />);

    expect(screen.getByRole("link")).toBeInTheDocument();
  });
});
