import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { User } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fakeUser: User = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  email: "alice@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2024-01-01T00:00:00Z",
} as User;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  // -------------------------------------------------------------------------
  // Initial loading state
  // -------------------------------------------------------------------------

  describe("initial state", () => {
    it("renders children immediately", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const { AuthProvider } = await import("./auth-provider");
      render(
        <AuthProvider>
          <span data-testid="child">content</span>
        </AuthProvider>,
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("starts with loading=true before getUser resolves", async () => {
      // Never resolves during this assertion
      mockGetUser.mockReturnValue(new Promise(() => {}));

      const { AuthProvider, useAuthContext } = await import("./auth-provider");

      function LoadingConsumer() {
        const { loading } = useAuthContext();
        return <div data-testid="loading">{loading ? "loading" : "ready"}</div>;
      }

      render(
        <AuthProvider>
          <LoadingConsumer />
        </AuthProvider>,
      );

      expect(screen.getByTestId("loading")).toHaveTextContent("loading");
    });
  });

  // -------------------------------------------------------------------------
  // Successful getUser
  // -------------------------------------------------------------------------

  describe("getUser — success", () => {
    it("sets user and loading=false after getUser resolves with a user", async () => {
      mockGetUser.mockResolvedValue({ data: { user: fakeUser } });

      const { AuthProvider, useAuthContext } = await import("./auth-provider");

      function Consumer() {
        const { user, loading } = useAuthContext();
        return (
          <>
            <div data-testid="loading">{loading ? "loading" : "ready"}</div>
            <div data-testid="user">{user?.email ?? "null"}</div>
          </>
        );
      }

      render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      });

      expect(screen.getByTestId("user")).toHaveTextContent(fakeUser.email!);
    });

    it("sets loading=false with null user when getUser resolves with no session", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const { AuthProvider, useAuthContext } = await import("./auth-provider");

      function Consumer() {
        const { loading, user } = useAuthContext();
        return (
          <>
            <div data-testid="loading">{loading ? "loading" : "ready"}</div>
            <div data-testid="user">{user?.email ?? "null"}</div>
          </>
        );
      }

      render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      });

      expect(screen.getByTestId("user")).toHaveTextContent("null");
    });
  });

  // -------------------------------------------------------------------------
  // H5 — getUser error handling
  // -------------------------------------------------------------------------

  describe("getUser — error (H5 fix)", () => {
    it("sets loading=false when getUser rejects (network error)", async () => {
      mockGetUser.mockRejectedValue(new Error("Network error"));

      const { AuthProvider, useAuthContext } = await import("./auth-provider");

      function Consumer() {
        const { loading } = useAuthContext();
        return (
          <div data-testid="loading">{loading ? "loading" : "ready"}</div>
        );
      }

      render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>,
      );

      // Initially loading
      expect(screen.getByTestId("loading")).toHaveTextContent("loading");

      // After rejection, loading must become false — not stuck forever
      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      });
    });

    it("does not expose user when getUser rejects", async () => {
      mockGetUser.mockRejectedValue(new Error("Token expired"));

      const { AuthProvider, useAuthContext } = await import("./auth-provider");

      function Consumer() {
        const { user, loading } = useAuthContext();
        return (
          <>
            <div data-testid="loading">{loading ? "loading" : "ready"}</div>
            <div data-testid="user">{user?.email ?? "null"}</div>
          </>
        );
      }

      render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      });

      expect(screen.getByTestId("user")).toHaveTextContent("null");
    });
  });

  // -------------------------------------------------------------------------
  // onAuthStateChange
  // -------------------------------------------------------------------------

  describe("onAuthStateChange", () => {
    it("subscribes to auth state changes on mount", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const { AuthProvider } = await import("./auth-provider");
      render(
        <AuthProvider>
          <span />
        </AuthProvider>,
      );

      expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
    });

    it("unsubscribes on unmount", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const mockUnsubscribe = vi.fn();
      mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });

      const { AuthProvider } = await import("./auth-provider");
      const { unmount } = render(
        <AuthProvider>
          <span />
        </AuthProvider>,
      );

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });
});
