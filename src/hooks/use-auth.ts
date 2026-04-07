"use client";

import { useEffect, useState } from "react";
import type { AuthError, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/providers/auth-provider";
import { RUOLI } from "@/lib/constants";
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
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error ?? !data) return null;
  return data as Profile;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): UseAuthReturn {
  const { user, loading } = useAuthContext();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    fetchProfile(user.id).then(setProfile);
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
