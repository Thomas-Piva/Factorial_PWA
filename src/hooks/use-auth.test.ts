import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// 1. Mock Supabase client
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignIn,
      signUp: mockSignUp,
      signOut: mockSignOut,
    },
    from: mockFrom,
  }),
}));

// 2. Mock the AuthContext
const mockUseAuthContext = vi.fn();
vi.mock("@/providers/auth-provider", () => ({
  useAuthContext: () => mockUseAuthContext(),
}));

// 3. Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fakeUser: User = {
  id: "user-123",
  email: "alice@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2024-01-01T00:00:00Z",
} as User;

const fakeProfile: Profile = {
  id: "user-123",
  email: "alice@example.com",
  full_name: "Alice Rossi",
  phone: null,
  role: "manager",
  workplace_id: "wp-1",
  avatar_url: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("state derivation", () => {
    it("returns null user and loading=true when auth is loading", async () => {
      mockUseAuthContext.mockReturnValue({ user: null, loading: true });

      const { useAuth } = await import("./use-auth");
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(true);
    });

    it("returns user when authenticated", async () => {
      mockUseAuthContext.mockReturnValue({ user: fakeUser, loading: false });
      mockFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({ data: fakeProfile, error: null }),
          }),
        }),
      });

      const { useAuth } = await import("./use-auth");
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toEqual(fakeUser);
    });

    it("returns null user when not authenticated", async () => {
      mockUseAuthContext.mockReturnValue({ user: null, loading: false });

      const { useAuth } = await import("./use-auth");
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("sets isAuthenticated=true when user is present", async () => {
      mockUseAuthContext.mockReturnValue({ user: fakeUser, loading: false });
      mockFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({ data: fakeProfile, error: null }),
          }),
        }),
      });

      const { useAuth } = await import("./use-auth");
      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe("profile fetching", () => {
    it("fetches profile when user is present", async () => {
      mockUseAuthContext.mockReturnValue({ user: fakeUser, loading: false });
      const mockSingle = vi
        .fn()
        .mockResolvedValue({ data: fakeProfile, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const { useAuth } = await import("./use-auth");
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.profile).toEqual(fakeProfile);
      });

      expect(mockFrom).toHaveBeenCalledWith("profiles");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockEq).toHaveBeenCalledWith("id", fakeUser.id);
    });

    it("returns null profile when user is absent", async () => {
      mockUseAuthContext.mockReturnValue({ user: null, loading: false });

      const { useAuth } = await import("./use-auth");
      const { result } = renderHook(() => useAuth());

      expect(result.current.profile).toBeNull();
    });

    it("derives role from profile", async () => {
      mockUseAuthContext.mockReturnValue({ user: fakeUser, loading: false });
      mockFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({ data: fakeProfile, error: null }),
          }),
        }),
      });

      const { useAuth } = await import("./use-auth");
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.role).toBe("manager");
      });
    });

    it("returns null role when profile is not yet loaded", async () => {
      mockUseAuthContext.mockReturnValue({ user: null, loading: false });

      const { useAuth } = await import("./use-auth");
      const { result } = renderHook(() => useAuth());

      expect(result.current.role).toBeNull();
    });
  });

  describe("signIn action", () => {
    it("calls supabase.auth.signInWithPassword with email and password", async () => {
      mockUseAuthContext.mockReturnValue({ user: null, loading: false });
      mockSignIn.mockResolvedValue({ data: {}, error: null });

      const { useAuth } = await import("./use-auth");
      const { result } = renderHook(() => useAuth());

      await result.current.signIn("alice@example.com", "password123");

      expect(mockSignIn).toHaveBeenCalledWith({
        email: "alice@example.com",
        password: "password123",
      });
    });

    it("returns error when signIn fails", async () => {
      mockUseAuthContext.mockReturnValue({ user: null, loading: false });
      const authError = { message: "Invalid credentials", status: 400 };
      mockSignIn.mockResolvedValue({ data: null, error: authError });

      const { useAuth } = await import("./use-auth");
      const { result } = renderHook(() => useAuth());

      const error = await result.current.signIn(
        "wrong@example.com",
        "bad-pass",
      );

      expect(error).toBeTruthy();
      expect(error?.message).toBe("Invalid credentials");
    });

    it("returns null on successful signIn", async () => {
      mockUseAuthContext.mockReturnValue({ user: null, loading: false });
      mockSignIn.mockResolvedValue({ data: { user: fakeUser }, error: null });

      const { useAuth } = await import("./use-auth");
      const { result } = renderHook(() => useAuth());

      const error = await result.current.signIn(
        "alice@example.com",
        "correct-password",
      );

      expect(error).toBeNull();
    });
  });

  describe("signOut action", () => {
    it("calls supabase.auth.signOut", async () => {
      mockUseAuthContext.mockReturnValue({ user: fakeUser, loading: false });
      mockSignOut.mockResolvedValue({ error: null });

      const { useAuth } = await import("./use-auth");
      const { result } = renderHook(() => useAuth());

      await result.current.signOut();

      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });

  describe("isManager / isEmployee helpers", () => {
    it("returns isManager=true when role is manager", async () => {
      mockUseAuthContext.mockReturnValue({ user: fakeUser, loading: false });
      mockFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({ data: fakeProfile, error: null }),
          }),
        }),
      });

      const { useAuth } = await import("./use-auth");
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isManager).toBe(true);
        expect(result.current.isEmployee).toBe(false);
      });
    });

    it("returns isEmployee=true when role is employee", async () => {
      const employeeProfile: Profile = { ...fakeProfile, role: "employee" };
      mockUseAuthContext.mockReturnValue({ user: fakeUser, loading: false });
      mockFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({ data: employeeProfile, error: null }),
          }),
        }),
      });

      const { useAuth } = await import("./use-auth");
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isEmployee).toBe(true);
        expect(result.current.isManager).toBe(false);
      });
    });
  });
});
