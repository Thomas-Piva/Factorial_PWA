"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registerSchema } from "./_schema";
import type { UserRole } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RegisterUserData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: UserRole;
}

export interface RegisterUserResult {
  error: string | null;
}

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

/**
 * Creates a new user via Supabase Auth Admin API and upserts their profile.
 *
 * Security:
 * - H2: Independently verifies the caller holds the "manager" role server-side.
 *   The RoleGate in the UI is a UX guard only; this is the authoritative check.
 * - H3: Validates all inputs with Zod before touching the Admin API.
 * - Must only be called from Server Actions / Route Handlers — never from the browser.
 */
export async function registerUser(
  data: RegisterUserData,
): Promise<RegisterUserResult> {
  // -------------------------------------------------------------------------
  // H2 — Server-side authorization: verify caller is an authenticated manager
  // -------------------------------------------------------------------------
  const serverClient = await createServerClient();

  const {
    data: { user: caller },
    error: callerAuthError,
  } = await serverClient.auth.getUser();

  // H1 fix: use || (not ??) — we want to bail out if there is an error OR the
  // user is absent. ?? only short-circuits on null/undefined, which would
  // silently pass a falsy-but-non-nullish error value (e.g. 0 or "").
  if (callerAuthError || !caller) {
    return { error: "Non autorizzato: sessione non valida" };
  }

  const { data: callerProfile, error: callerProfileError } = await serverClient
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (callerProfileError || !callerProfile) {
    return { error: "Non autorizzato: impossibile verificare il ruolo" };
  }

  if (callerProfile.role !== "manager") {
    return {
      error: "Non autorizzato: solo i manager possono registrare nuovi utenti",
    };
  }

  // -------------------------------------------------------------------------
  // H3 — Server-side input validation: never trust client-supplied data
  // -------------------------------------------------------------------------
  const validation = registerSchema.safeParse(data);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message ?? "Dati non validi",
    };
  }

  // -------------------------------------------------------------------------
  // Registration via Admin API
  // -------------------------------------------------------------------------
  const admin = createAdminClient();

  // Split "full_name" into first_name / last_name for the DB schema
  const [first_name, ...rest] = data.full_name.trim().split(/\s+/);
  const last_name = rest.join(" ") || "-";

  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      user_metadata: {
        first_name,
        last_name,
        phone: data.phone || null,
        role: data.role,
      },
      email_confirm: true,
    });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Errore durante la registrazione" };
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: authData.user.id,
    email: data.email,
    first_name,
    last_name,
    phone: data.phone || null,
    role: data.role,
  });

  if (profileError) {
    return { error: profileError.message };
  }

  return { error: null };
}
