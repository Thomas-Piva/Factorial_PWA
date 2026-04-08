import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "./page-header";

describe("PageHeader", () => {
  it("renders the title text in an h1", () => {
    render(<PageHeader title="Dashboard" />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Dashboard");
  });

  it("renders children when provided", () => {
    render(
      <PageHeader title="Dashboard">
        <button>Azione</button>
      </PageHeader>,
    );

    expect(screen.getByRole("button", { name: "Azione" })).toBeInTheDocument();
  });

  it("does not render children slot content when no children are passed", () => {
    const { container } = render(<PageHeader title="Solo Titolo" />);

    // The h1 must be present
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();

    // No extra interactive elements should exist
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(container.querySelectorAll("h1")).toHaveLength(1);
  });
});
