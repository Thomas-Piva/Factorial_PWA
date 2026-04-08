import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UseAuthReturn } from "@/hooks/use-auth";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRegisterUser = vi.fn();
vi.mock("./_actions", () => ({
  registerUser: (...args: unknown[]) => mockRegisterUser(...args),
}));

vi.mock("@/components/shared/role-gate", () => ({
  RoleGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

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
    signIn: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RegisterPage / RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(
      makeAuthState({ isAuthenticated: true, role: "manager", isManager: true }),
    );
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  describe("rendering", () => {
    it("renders all required fields", async () => {
      const { RegisterForm } = await import("./page");
      render(<RegisterForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^nome$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cognome/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/telefono/i)).toBeInTheDocument();
    });

    it("renders a role selector", async () => {
      const { RegisterForm } = await import("./page");
      render(<RegisterForm />);

      expect(screen.getByRole("combobox", { name: /ruolo/i })).toBeInTheDocument();
    });

    it("renders the submit button", async () => {
      const { RegisterForm } = await import("./page");
      render(<RegisterForm />);

      expect(
        screen.getByRole("button", { name: /registra/i }),
      ).toBeInTheDocument();
    });

    it("does not render an error or success banner on initial render", async () => {
      const { RegisterForm } = await import("./page");
      render(<RegisterForm />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("role selector defaults to 'dipendente'", async () => {
      const { RegisterForm } = await import("./page");
      render(<RegisterForm />);

      const select = screen.getByRole("combobox", { name: /ruolo/i });
      expect((select as HTMLSelectElement).value).toBe("dipendente");
    });
  });

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  describe("validation", () => {
    it("shows email required error when form is submitted empty", async () => {
      const user = userEvent.setup();
      const { RegisterForm } = await import("./page");
      render(<RegisterForm />);

      await user.click(screen.getByRole("button", { name: /registra/i }));

      await waitFor(() => {
        expect(screen.getByText(/email.*obbligatori/i)).toBeInTheDocument();
      });
    });

    it("shows invalid email format error", async () => {
      const user = userEvent.setup();
      const { RegisterForm } = await import("./page");
      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/email/i), "non-un-email");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.type(screen.getByLabelText(/^nome$/i), "Mario");
      await user.type(screen.getByLabelText(/cognome/i), "Rossi");
      await user.type(screen.getByLabelText(/telefono/i), "3331234567");
      await user.click(screen.getByRole("button", { name: /registra/i }));

      await waitFor(() => {
        expect(screen.getByText(/email.*valida/i)).toBeInTheDocument();
      });
    });

    it("shows password too short error", async () => {
      const user = userEvent.setup();
      const { RegisterForm } = await import("./page");
      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/email/i), "mario@example.com");
      await user.type(screen.getByLabelText(/password/i), "short");
      await user.type(screen.getByLabelText(/^nome$/i), "Mario");
      await user.type(screen.getByLabelText(/cognome/i), "Rossi");
      await user.type(screen.getByLabelText(/telefono/i), "3331234567");
      await user.click(screen.getByRole("button", { name: /registra/i }));

      await waitFor(() => {
        expect(screen.getByText(/almeno 8 caratteri/i)).toBeInTheDocument();
      });
    });

    it("shows first_name required error", async () => {
      const user = userEvent.setup();
      const { RegisterForm } = await import("./page");
      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/email/i), "mario@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.type(screen.getByLabelText(/cognome/i), "Rossi");
      await user.type(screen.getByLabelText(/telefono/i), "3331234567");
      await user.click(screen.getByRole("button", { name: /registra/i }));

      await waitFor(() => {
        expect(screen.getByText(/nome.*obbligatorio/i)).toBeInTheDocument();
      });
    });

    it("shows phone required error", async () => {
      const user = userEvent.setup();
      const { RegisterForm } = await import("./page");
      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/email/i), "mario@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.type(screen.getByLabelText(/^nome$/i), "Mario");
      await user.type(screen.getByLabelText(/cognome/i), "Rossi");
      await user.click(screen.getByRole("button", { name: /registra/i }));

      await waitFor(() => {
        expect(screen.getByText(/telefono.*obbligatorio/i)).toBeInTheDocument();
      });
    });

    it("shows phone format error when phone contains invalid characters (H3)", async () => {
      const user = userEvent.setup();
      const { RegisterForm } = await import("./page");
      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/email/i), "mario@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.type(screen.getByLabelText(/^nome$/i), "Mario");
      await user.type(screen.getByLabelText(/cognome/i), "Rossi");
      await user.type(screen.getByLabelText(/telefono/i), "<script>xss</script>");
      await user.click(screen.getByRole("button", { name: /registra/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/numero di telefono valido/i),
        ).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Submit — success
  // -------------------------------------------------------------------------

  describe("submit — success", () => {
    const validFormData = {
      email: "mario@example.com",
      password: "password123",
      first_name: "Mario",
      last_name: "Rossi",
      phone: "3331234567",
    };

    async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
      await user.type(screen.getByLabelText(/email/i), validFormData.email);
      await user.type(
        screen.getByLabelText(/password/i),
        validFormData.password,
      );
      await user.type(
        screen.getByLabelText(/^nome$/i),
        validFormData.first_name,
      );
      await user.type(
        screen.getByLabelText(/cognome/i),
        validFormData.last_name,
      );
      await user.type(screen.getByLabelText(/telefono/i), validFormData.phone);
      await user.click(screen.getByRole("button", { name: /registra/i }));
    }

    it("calls registerUser with the correct payload", async () => {
      mockRegisterUser.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      const { RegisterForm } = await import("./page");
      render(<RegisterForm />);

      await fillAndSubmit(user);

      await waitFor(() => {
        expect(mockRegisterUser).toHaveBeenCalledWith({
          email: validFormData.email,
          password: validFormData.password,
          first_name: validFormData.first_name,
          last_name: validFormData.last_name,
          phone: validFormData.phone,
          role: "dipendente",
        });
      });
    });

    it("shows a success banner after successful registration", async () => {
      mockRegisterUser.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      const { RegisterForm } = await import("./page");
      render(<RegisterForm />);

      await fillAndSubmit(user);

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });
    });

    it("shows the success message text", async () => {
      mockRegisterUser.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      const { RegisterForm } = await import("./page");
      render(<RegisterForm />);

      await fillAndSubmit(user);

      await waitFor(() => {
        expect(
          screen.getByText(/utente registrato con successo/i),
        ).toBeInTheDocument();
      });
    });

    it("does not show an error alert after successful registration", async () => {
      mockRegisterUser.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      const { RegisterForm } = await import("./page");
      render(<RegisterForm />);

      await fillAndSubmit(user);

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("does not redirect after successful registration", async () => {
      mockRegisterUser.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      const { RegisterForm } = await import("./page");
      render(<RegisterForm />);

      await fillAndSubmit(user);

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Submit — error
  // -------------------------------------------------------------------------

  describe("submit — error", () => {
    async function fillAndSubmitBad(user: ReturnType<typeof userEvent.setup>) {
      await user.type(
        screen.getByLabelText(/email/i),
        "esistente@example.com",
      );
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.type(screen.getByLabelText(/^nome$/i), "Utente");
      await user.type(screen.getByLabelText(/cognome/i), "Esistente");
      await user.type(screen.getByLabelText(/telefono/i), "3331234567");
      await user.click(screen.getByRole("button", { name: /registra/i }));
    }

    it("shows an error alert when registerUser returns an error", async () => {
      mockRegisterUser.mockResolvedValue({ error: "Email già in uso" });
      const user = userEvent.setup();
      const { RegisterForm } = await import("./page");
      render(<RegisterForm />);

      await fillAndSubmitBad(user);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });

    it("shows the error message text from the action", async () => {
      mockRegisterUser.mockResolvedValue({ error: "Email già in uso" });
      const user = userEvent.setup();
      const { RegisterForm } = await import("./page");
      render(<RegisterForm />);

      await fillAndSubmitBad(user);

      await waitFor(() => {
        expect(screen.getByText(/email già in uso/i)).toBeInTheDocument();
      });
    });

    it("does not show success banner when registration fails", async () => {
      mockRegisterUser.mockResolvedValue({ error: "Email già in uso" });
      const user = userEvent.setup();
      const { RegisterForm } = await import("./page");
      render(<RegisterForm />);

      await fillAndSubmitBad(user);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("does not redirect on failed registration", async () => {
      mockRegisterUser.mockResolvedValue({ error: "Errore generico" });
      const user = userEvent.setup();
      const { RegisterForm } = await import("./page");
      render(<RegisterForm />);

      await fillAndSubmitBad(user);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  describe("loading state", () => {
    it("disables the submit button while registration is in progress", async () => {
      let resolveAction: (value: { error: null }) => void;
      mockRegisterUser.mockReturnValue(
        new Promise<{ error: null }>((resolve) => {
          resolveAction = resolve;
        }),
      );

      const user = userEvent.setup();
      const { RegisterForm } = await import("./page");
      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/email/i), "mario@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.type(screen.getByLabelText(/^nome$/i), "Mario");
      await user.type(screen.getByLabelText(/cognome/i), "Rossi");
      await user.type(screen.getByLabelText(/telefono/i), "3331234567");

      const button = screen.getByRole("button", { name: /registra/i });
      await user.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });

      resolveAction!({ error: null });
    });
  });

  // -------------------------------------------------------------------------
  // Full page — default export wraps with RoleGate
  // -------------------------------------------------------------------------

  describe("default export — RoleGate integration", () => {
    it("renders the form inside the default export", async () => {
      const { default: RegisterPage } = await import("./page");
      render(<RegisterPage />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });
  });
});
