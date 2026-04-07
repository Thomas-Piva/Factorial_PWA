import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UseAuthReturn } from "@/hooks/use-auth";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSignIn = vi.fn();
const mockUseAuth = vi.fn();

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: mockPush })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAuthState(overrides: Partial<UseAuthReturn> = {}): UseAuthReturn {
  return {
    user: null,
    loading: false,
    isAuthenticated: false,
    profile: null,
    role: null,
    isManager: false,
    isEmployee: false,
    signIn: mockSignIn,
    signOut: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(makeAuthState());
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  describe("rendering", () => {
    it("renders email and password fields", async () => {
      const { default: LoginPage } = await import("./page");
      render(<LoginPage />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it("renders a submit button", async () => {
      const { default: LoginPage } = await import("./page");
      render(<LoginPage />);

      expect(
        screen.getByRole("button", { name: /accedi/i }),
      ).toBeInTheDocument();
    });

    it("does not render an error message on initial render", async () => {
      const { default: LoginPage } = await import("./page");
      render(<LoginPage />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Zod validation — empty fields
  // -------------------------------------------------------------------------

  describe("validation", () => {
    it("shows email required error when submitting empty form", async () => {
      const user = userEvent.setup();
      const { default: LoginPage } = await import("./page");
      render(<LoginPage />);

      await user.click(screen.getByRole("button", { name: /accedi/i }));

      await waitFor(() => {
        expect(screen.getByText(/email.*obbligatori/i)).toBeInTheDocument();
      });
    });

    it("shows password required error when submitting with email only", async () => {
      const user = userEvent.setup();
      const { default: LoginPage } = await import("./page");
      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.click(screen.getByRole("button", { name: /accedi/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/password.*obbligatori/i),
        ).toBeInTheDocument();
      });
    });

    it("shows email format error when email is invalid", async () => {
      const user = userEvent.setup();
      const { default: LoginPage } = await import("./page");
      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email/i), "not-an-email");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /accedi/i }));

      await waitFor(() => {
        expect(screen.getByText(/email.*valida/i)).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Submit — success
  // -------------------------------------------------------------------------

  describe("submit — success", () => {
    it("calls signIn with email and password on valid submit", async () => {
      mockSignIn.mockResolvedValue(null);
      const user = userEvent.setup();
      const { default: LoginPage } = await import("./page");
      render(<LoginPage />);

      await user.type(
        screen.getByLabelText(/email/i),
        "alice@example.com",
      );
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /accedi/i }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(
          "alice@example.com",
          "password123",
        );
      });
    });

    it("redirects to /dashboard after successful login", async () => {
      mockSignIn.mockResolvedValue(null);
      const user = userEvent.setup();
      const { default: LoginPage } = await import("./page");
      render(<LoginPage />);

      await user.type(
        screen.getByLabelText(/email/i),
        "alice@example.com",
      );
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /accedi/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("does not show error message after successful login", async () => {
      mockSignIn.mockResolvedValue(null);
      const user = userEvent.setup();
      const { default: LoginPage } = await import("./page");
      render(<LoginPage />);

      await user.type(
        screen.getByLabelText(/email/i),
        "alice@example.com",
      );
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /accedi/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Submit — error
  // -------------------------------------------------------------------------

  describe("submit — error", () => {
    it("shows inline error message when signIn returns an error", async () => {
      mockSignIn.mockResolvedValue({
        message: "Credenziali non valide",
        status: 400,
      });
      const user = userEvent.setup();
      const { default: LoginPage } = await import("./page");
      render(<LoginPage />);

      await user.type(
        screen.getByLabelText(/email/i),
        "wrong@example.com",
      );
      await user.type(screen.getByLabelText(/password/i), "wrongpass");
      await user.click(screen.getByRole("button", { name: /accedi/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });

    it("shows the error message text from signIn failure", async () => {
      mockSignIn.mockResolvedValue({
        message: "Credenziali non valide",
        status: 400,
      });
      const user = userEvent.setup();
      const { default: LoginPage } = await import("./page");
      render(<LoginPage />);

      await user.type(
        screen.getByLabelText(/email/i),
        "wrong@example.com",
      );
      await user.type(screen.getByLabelText(/password/i), "wrongpass");
      await user.click(screen.getByRole("button", { name: /accedi/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/credenziali non valide/i),
        ).toBeInTheDocument();
      });
    });

    it("does not redirect on failed login", async () => {
      mockSignIn.mockResolvedValue({
        message: "Credenziali non valide",
        status: 400,
      });
      const user = userEvent.setup();
      const { default: LoginPage } = await import("./page");
      render(<LoginPage />);

      await user.type(
        screen.getByLabelText(/email/i),
        "wrong@example.com",
      );
      await user.type(screen.getByLabelText(/password/i), "wrongpass");
      await user.click(screen.getByRole("button", { name: /accedi/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Loading state during submit
  // -------------------------------------------------------------------------

  describe("loading state", () => {
    it("disables submit button while login is in progress", async () => {
      let resolveSignIn: (value: null) => void;
      mockSignIn.mockReturnValue(
        new Promise<null>((resolve) => {
          resolveSignIn = resolve;
        }),
      );

      const user = userEvent.setup();
      const { default: LoginPage } = await import("./page");
      render(<LoginPage />);

      await user.type(
        screen.getByLabelText(/email/i),
        "alice@example.com",
      );
      await user.type(screen.getByLabelText(/password/i), "password123");

      const button = screen.getByRole("button", { name: /accedi/i });
      await user.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });

      resolveSignIn!(null);
    });
  });
});
