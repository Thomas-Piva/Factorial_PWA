import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Server client — used for caller auth + role check
const mockGetUser = vi.fn();
const mockServerSingle = vi.fn();
const mockServerEq = vi.fn(() => ({ single: mockServerSingle }));
const mockServerSelect = vi.fn(() => ({ eq: mockServerEq }));
const mockServerFrom = vi.fn(() => ({ select: mockServerSelect }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockServerFrom,
    }),
  ),
}));

// Admin client — used for createUser + profile upsert
const mockCreateUser = vi.fn();
const mockUpsert = vi.fn();
const mockAdminFrom = vi.fn(() => ({ upsert: mockUpsert }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    auth: { admin: { createUser: mockCreateUser } },
    from: mockAdminFrom,
  })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MANAGER_UUID = "550e8400-e29b-41d4-a716-446655440010";
const NEW_USER_UUID = "550e8400-e29b-41d4-a716-446655440020";

const callerUser: Partial<User> = {
  id: MANAGER_UUID,
  email: "manager@example.com",
};

const validPayload = {
  email: "nuovo@example.com",
  password: "password123",
  full_name: "Nuovo Dipendente",
  phone: "3331234567",
  role: "employee" as const,
};

function mockManagerCaller() {
  mockGetUser.mockResolvedValue({ data: { user: callerUser }, error: null });
  mockServerSingle.mockResolvedValue({
    data: { role: "manager" },
    error: null,
  });
}

function mockSuccessfulCreation() {
  mockCreateUser.mockResolvedValue({
    data: { user: { id: NEW_USER_UUID } },
    error: null,
  });
  mockUpsert.mockResolvedValue({ error: null });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("registerUser — server action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // H2 — Authorization checks
  // -------------------------------------------------------------------------

  describe("authorization (H2)", () => {
    it("returns error when getUser fails (no valid session)", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Token expired" },
      });

      const { registerUser } = await import("./_actions");
      const result = await registerUser(validPayload);

      expect(result.error).toMatch(/non autorizzato/i);
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it("returns error when caller has no session (user is null)", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const { registerUser } = await import("./_actions");
      const result = await registerUser(validPayload);

      expect(result.error).toMatch(/non autorizzato/i);
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it("returns error when caller profile cannot be fetched", async () => {
      mockGetUser.mockResolvedValue({ data: { user: callerUser }, error: null });
      mockServerSingle.mockResolvedValue({
        data: null,
        error: { message: "not found" },
      });

      const { registerUser } = await import("./_actions");
      const result = await registerUser(validPayload);

      expect(result.error).toMatch(/non autorizzato/i);
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it("returns error when caller role is 'employee' (not a manager)", async () => {
      mockGetUser.mockResolvedValue({ data: { user: callerUser }, error: null });
      mockServerSingle.mockResolvedValue({
        data: { role: "employee" },
        error: null,
      });

      const { registerUser } = await import("./_actions");
      const result = await registerUser(validPayload);

      expect(result.error).toMatch(/solo i manager/i);
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it("proceeds with registration when caller is a manager", async () => {
      mockManagerCaller();
      mockSuccessfulCreation();

      const { registerUser } = await import("./_actions");
      const result = await registerUser(validPayload);

      expect(result.error).toBeNull();
      expect(mockCreateUser).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // H3 — Server-side input validation
  // -------------------------------------------------------------------------

  describe("input validation (H3)", () => {
    beforeEach(() => {
      mockManagerCaller();
    });

    it("returns error when email is invalid", async () => {
      const { registerUser } = await import("./_actions");
      const result = await registerUser({ ...validPayload, email: "non-un-email" });

      expect(result.error).toBeTruthy();
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it("returns error when password is too short", async () => {
      const { registerUser } = await import("./_actions");
      const result = await registerUser({ ...validPayload, password: "short" });

      expect(result.error).toBeTruthy();
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it("returns error when phone contains invalid characters (XSS attempt)", async () => {
      const { registerUser } = await import("./_actions");
      const result = await registerUser({
        ...validPayload,
        phone: "<script>alert(1)</script>",
      });

      expect(result.error).toBeTruthy();
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it("passes validation and proceeds for valid payload", async () => {
      mockSuccessfulCreation();

      const { registerUser } = await import("./_actions");
      const result = await registerUser(validPayload);

      expect(result.error).toBeNull();
      expect(mockCreateUser).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Registration logic
  // -------------------------------------------------------------------------

  describe("registration", () => {
    beforeEach(() => {
      mockManagerCaller();
    });

    it("calls createUser with the correct payload", async () => {
      mockSuccessfulCreation();

      const { registerUser } = await import("./_actions");
      await registerUser(validPayload);

      expect(mockCreateUser).toHaveBeenCalledWith({
        email: validPayload.email,
        password: validPayload.password,
        user_metadata: {
          first_name: "Nuovo",
          last_name: "Dipendente",
          phone: validPayload.phone,
          role: validPayload.role,
        },
        email_confirm: true,
      });
    });

    it("upserts profile after createUser succeeds", async () => {
      mockSuccessfulCreation();

      const { registerUser } = await import("./_actions");
      await registerUser(validPayload);

      expect(mockAdminFrom).toHaveBeenCalledWith("profiles");
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: NEW_USER_UUID,
          email: validPayload.email,
          first_name: "Nuovo",
          last_name: "Dipendente",
          role: validPayload.role,
        }),
      );
    });

    it("returns error when createUser fails", async () => {
      mockCreateUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Email già in uso" },
      });

      const { registerUser } = await import("./_actions");
      const result = await registerUser(validPayload);

      expect(result.error).toBe("Email già in uso");
      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it("returns error when profile upsert fails", async () => {
      mockCreateUser.mockResolvedValue({
        data: { user: { id: NEW_USER_UUID } },
        error: null,
      });
      mockUpsert.mockResolvedValue({
        error: { message: "Errore DB profilo" },
      });

      const { registerUser } = await import("./_actions");
      const result = await registerUser(validPayload);

      expect(result.error).toBe("Errore DB profilo");
    });

    it("returns null error on full success", async () => {
      mockSuccessfulCreation();

      const { registerUser } = await import("./_actions");
      const result = await registerUser(validPayload);

      expect(result.error).toBeNull();
    });

    it("rejects empty phone — H3 server-side validation blocks before createUser", async () => {
      // Before H3, empty phone was allowed and converted to null.
      // With server-side Zod validation, an empty phone is now a validation error.
      const { registerUser } = await import("./_actions");
      const result = await registerUser({ ...validPayload, phone: "" });

      expect(result.error).toBeTruthy();
      expect(mockCreateUser).not.toHaveBeenCalled();
    });
  });
});
