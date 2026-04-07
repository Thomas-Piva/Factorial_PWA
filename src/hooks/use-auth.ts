"use client";

import { useEffect, useState } from "react";
import type { AuthError, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/providers/auth-provider";
import { RUOLI } from "@/lib/constants";
import { profileSchema } from "@/lib/validations/profile";
import type { Profile, UserRole } from "@/types";

// ---------------------------------------------------------------------------
// Public contract
// ---------------------------------------------------------------------------

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  profile: Profile | null;
  role: UserRole | null;
  isManager: boolean;
  isEmployee: boolean;
  signIn: (email: string, password: string) => Promise<AuthError | null>;
  signOut: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  // database.ts is a placeholder until types are regenerated; cast required.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("id, email, full_name, phone, role, workplace_id, avatar_url, created_at, updated_at")
    .eq("id", userId)
    .single();

  if (error ?? !data) return null;

  // H4: validate the raw DB row before trusting it as Profile
  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) return null;

  return parsed.data as Profile;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): UseAuthReturn {
  const { user, loading } = useAuthContext();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const task = user ? fetchProfile(user.id) : Promise.resolve(null);
    void task.then(setProfile);
  }, [user]);

  async function signIn(
    email: string,
    password: string,
  ): Promise<AuthError | null> {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return error;
  }

  async function signOut(): Promise<void> {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  const role = profile?.role ?? null;

  return {
    user,
    loading,
    isAuthenticated: user !== null,
    profile,
    role,
    isManager: role === RUOLI.MANAGER,
    isEmployee: role === RUOLI.EMPLOYEE,
    signIn,
    signOut,
  };
}
