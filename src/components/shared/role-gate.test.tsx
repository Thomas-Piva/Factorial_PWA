import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { UseAuthReturn } from "@/hooks/use-auth";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUseAuth = vi.fn();
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: mockPush })),
  redirect: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAuthState(overrides: Partial<UseAuthReturn>): UseAuthReturn {
  return {
    user: null,
    loading: false,
    isAuthenticated: false,
    profile: null,
    role: null,
    isManager: false,
    isEmployee: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RoleGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  describe("loading state", () => {
    it("renders null when loading=true regardless of children and fallback", async () => {
      mockUseAuth.mockReturnValue(makeAuthState({ loading: true }));

      const { RoleGate } = await import("./role-gate");
      const { container } = render(
        <RoleGate allowedRoles={["manager"]} fallback={<span>fallback</span>}>
          <span>protected</span>
        </RoleGate>,
      );

      expect(container.firstChild).toBeNull();
      expect(screen.queryByText("protected")).not.toBeInTheDocument();
      expect(screen.queryByText("fallback")).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Unauthenticated user
  // -------------------------------------------------------------------------

  describe("unauthenticated user", () => {
    it("renders null when user=null and no fallback prop", async () => {
      mockUseAuth.mockReturnValue(
        makeAuthState({ user: null, isAuthenticated: false }),
      );

      const { RoleGate } = await import("./role-gate");
      const { container } = render(
        <RoleGate allowedRoles={["manager"]}>
          <span>protected</span>
        </RoleGate>,
      );

      expect(container.firstChild).toBeNull();
      expect(screen.queryByText("protected")).not.toBeInTheDocument();
    });

    it("renders fallback when user=null and fallback prop is provided", async () => {
      mockUseAuth.mockReturnValue(
        makeAuthState({ user: null, isAuthenticated: false }),
      );

      const { RoleGate } = await import("./role-gate");
      render(
        <RoleGate
          allowedRoles={["manager"]}
          fallback={<span>accesso negato</span>}
        >
          <span>protected</span>
        </RoleGate>,
      );

      expect(screen.getByText("accesso negato")).toBeInTheDocument();
      expect(screen.queryByText("protected")).not.toBeInTheDocument();
    });

    it("calls router.push with redirectTo when user=null and redirectTo is provided", async () => {
      mockUseAuth.mockReturnValue(
        makeAuthState({ user: null, isAuthenticated: false }),
      );

      const { RoleGate } = await import("./role-gate");
      render(
        <RoleGate allowedRoles={["manager"]} redirectTo="/login">
          <span>protected</span>
        </RoleGate>,
      );

      expect(mockPush).toHaveBeenCalledWith("/login");
      expect(screen.queryByText("protected")).not.toBeInTheDocument();
    });

    it("does not render children when unauthenticated with redirectTo", async () => {
      mockUseAuth.mockReturnValue(
        makeAuthState({ user: null, isAuthenticated: false }),
      );

      const { RoleGate } = await import("./role-gate");
      const { container } = render(
        <RoleGate allowedRoles={["manager"]} redirectTo="/login">
          <span>protected</span>
        </RoleGate>,
      );

      expect(screen.queryByText("protected")).not.toBeInTheDocument();
      expect(container.firstChild).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Role not authorized
  // -------------------------------------------------------------------------

  describe("role not authorized", () => {
    it("renders fallback when role=employee and allowedRoles=['manager']", async () => {
      mockUseAuth.mockReturnValue(
        makeAuthState({
          isAuthenticated: true,
          role: "dipendente",
          isEmployee: true,
        }),
      );

      const { RoleGate } = await import("./role-gate");
      render(
        <RoleGate
          allowedRoles={["manager"]}
          fallback={<span>non autorizzato</span>}
        >
          <span>area manager</span>
        </RoleGate>,
      );

      expect(screen.getByText("non autorizzato")).toBeInTheDocument();
      expect(screen.queryByText("area manager")).not.toBeInTheDocument();
    });

    it("renders null (no fallback) when role is not authorized and fallback not provided", async () => {
      mockUseAuth.mockReturnValue(
        makeAuthState({
          isAuthenticated: true,
          role: "dipendente",
          isEmployee: true,
        }),
      );

      const { RoleGate } = await import("./role-gate");
      const { container } = render(
        <RoleGate allowedRoles={["manager"]}>
          <span>area manager</span>
        </RoleGate>,
      );

      expect(container.firstChild).toBeNull();
      expect(screen.queryByText("area manager")).not.toBeInTheDocument();
    });

    it("calls router.push when role is not authorized and redirectTo is provided", async () => {
      mockUseAuth.mockReturnValue(
        makeAuthState({
          isAuthenticated: true,
          role: "dipendente",
          isEmployee: true,
        }),
      );

      const { RoleGate } = await import("./role-gate");
      render(
        <RoleGate allowedRoles={["manager"]} redirectTo="/unauthorized">
          <span>area manager</span>
        </RoleGate>,
      );

      expect(mockPush).toHaveBeenCalledWith("/unauthorized");
      expect(screen.queryByText("area manager")).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Role authorized
  // -------------------------------------------------------------------------

  describe("role authorized", () => {
    it("renders children when role=manager and allowedRoles=['manager']", async () => {
      mockUseAuth.mockReturnValue(
        makeAuthState({
          isAuthenticated: true,
          role: "manager",
          isManager: true,
        }),
      );

      const { RoleGate } = await import("./role-gate");
      render(
        <RoleGate allowedRoles={["manager"]}>
          <span>area manager</span>
        </RoleGate>,
      );

      expect(screen.getByText("area manager")).toBeInTheDocument();
    });

    it("renders children when role=employee and allowedRoles=['employee']", async () => {
      mockUseAuth.mockReturnValue(
        makeAuthState({
          isAuthenticated: true,
          role: "dipendente",
          isEmployee: true,
        }),
      );

      const { RoleGate } = await import("./role-gate");
      render(
        <RoleGate allowedRoles={["dipendente"]}>
          <span>area dipendente</span>
        </RoleGate>,
      );

      expect(screen.getByText("area dipendente")).toBeInTheDocument();
    });

    it("renders children when allowedRoles includes both manager and employee", async () => {
      mockUseAuth.mockReturnValue(
        makeAuthState({
          isAuthenticated: true,
          role: "dipendente",
          isEmployee: true,
        }),
      );

      const { RoleGate } = await import("./role-gate");
      render(
        <RoleGate allowedRoles={["manager", "dipendente"]}>
          <span>area condivisa</span>
        </RoleGate>,
      );

      expect(screen.getByText("area condivisa")).toBeInTheDocument();
    });

    it("renders children without calling router.push when authorized", async () => {
      mockUseAuth.mockReturnValue(
        makeAuthState({
          isAuthenticated: true,
          role: "manager",
          isManager: true,
        }),
      );

      const { RoleGate } = await import("./role-gate");
      render(
        <RoleGate allowedRoles={["manager"]} redirectTo="/unauthorized">
          <span>area manager</span>
        </RoleGate>,
      );

      expect(screen.getByText("area manager")).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Custom fallback
  // -------------------------------------------------------------------------

  describe("custom fallback rendering", () => {
    it("renders a complex fallback node when not authorized", async () => {
      mockUseAuth.mockReturnValue(
        makeAuthState({ isAuthenticated: false, user: null }),
      );

      const { RoleGate } = await import("./role-gate");
      render(
        <RoleGate
          allowedRoles={["manager"]}
          fallback={
            <div data-testid="custom-fallback">
              <h1>Accesso negato</h1>
              <p>Non hai i permessi necessari.</p>
            </div>
          }
        >
          <span>protected</span>
        </RoleGate>,
      );

      expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
      expect(screen.getByText("Accesso negato")).toBeInTheDocument();
      expect(
        screen.getByText("Non hai i permessi necessari."),
      ).toBeInTheDocument();
      expect(screen.queryByText("protected")).not.toBeInTheDocument();
    });

    it("does not render fallback when user is authorized", async () => {
      mockUseAuth.mockReturnValue(
        makeAuthState({
          isAuthenticated: true,
          role: "manager",
          isManager: true,
        }),
      );

      const { RoleGate } = await import("./role-gate");
      render(
        <RoleGate
          allowedRoles={["manager"]}
          fallback={<span data-testid="fallback">fallback</span>}
        >
          <span>protected content</span>
        </RoleGate>,
      );

      expect(screen.getByText("protected content")).toBeInTheDocument();
      expect(screen.queryByTestId("fallback")).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe("edge cases", () => {
    it("renders null when allowedRoles is empty array (no roles allowed)", async () => {
      mockUseAuth.mockReturnValue(
        makeAuthState({
          isAuthenticated: true,
          role: "manager",
          isManager: true,
        }),
      );

      const { RoleGate } = await import("./role-gate");
      const { container } = render(
        <RoleGate allowedRoles={[]}>
          <span>protected</span>
        </RoleGate>,
      );

      expect(container.firstChild).toBeNull();
      expect(screen.queryByText("protected")).not.toBeInTheDocument();
    });

    it("renders null when role=null even if isAuthenticated=true (profile not yet loaded)", async () => {
      mockUseAuth.mockReturnValue(
        makeAuthState({
          isAuthenticated: true,
          role: null,
        }),
      );

      const { RoleGate } = await import("./role-gate");
      const { container } = render(
        <RoleGate allowedRoles={["manager", "dipendente"]}>
          <span>protected</span>
        </RoleGate>,
      );

      expect(container.firstChild).toBeNull();
      expect(screen.queryByText("protected")).not.toBeInTheDocument();
    });
  });
});
