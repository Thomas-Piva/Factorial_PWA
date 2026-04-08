"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RUOLI } from "@/lib/constants";
import { registerSchema } from "./_schema";
import type { UserRole } from "@/types";

export interface RegisterUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: UserRole;
}

export interface RegisterUserResult {
  error: string | null;
}

export async function registerUser(
  data: RegisterUserData,
): Promise<RegisterUserResult> {
  const serverClient = await createServerClient();

  const {
    data: { user: caller },
    error: callerAuthError,
  } = await serverClient.auth.getUser();

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

  if (callerProfile.role !== RUOLI.MANAGER) {
    return {
      error: "Non autorizzato: solo i manager possono registrare nuovi utenti",
    };
  }

  const validation = registerSchema.safeParse(data);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message ?? "Dati non validi",
    };
  }

  const admin = createAdminClient();

  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      user_metadata: {
        first_name: data.first_name,
        last_name: data.last_name,
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
    first_name: data.first_name,
    last_name: data.last_name,
    phone: data.phone || null,
    role: data.role,
  });

  if (profileError) {
    return { error: profileError.message };
  }

  return { error: null };
}
