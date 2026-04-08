// Shared domain types used across the application.

export type UserRole = "manager" | "dipendente";

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  gender: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Workplace {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
}

export type WeekStatus = "bozza" | "pubblicato";
