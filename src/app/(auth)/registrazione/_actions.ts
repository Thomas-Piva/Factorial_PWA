"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  if (callerAuthError ?? !caller) {
    return { error: "Non autorizzato: sessione non valida" };
  }

  // database.ts is a placeholder until types are regenerated.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serverAny = serverClient as any;
  const { data: callerProfile, error: callerProfileError } = await serverAny
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (callerProfileError ?? !callerProfile) {
    return { error: "Non autorizzato: impossibile verificare il ruolo" };
  }

  if (callerProfile.role !== "manager") {
    return {
      error: "Non autorizzato: solo i manager possono registrare nuovi utenti",
    };
  }

  // -------------------------------------------------------------------------
  // Registration via Admin API
  // -------------------------------------------------------------------------
  const admin = createAdminClient();

  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      user_metadata: {
        full_name: data.full_name,
        phone: data.phone || null,
        role: data.role,
      },
      email_confirm: true,
    });

  if (authError ?? !authData.user) {
    return { error: authError?.message ?? "Errore durante la registrazione" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (admin as any).from("profiles").upsert({
    id: authData.user.id,
    email: data.email,
    full_name: data.full_name,
    phone: data.phone || null,
    role: data.role,
  });

  if (profileError) {
    return { error: profileError.message };
  }

  return { error: null };
}
