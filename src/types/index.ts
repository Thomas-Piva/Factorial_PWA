// Shared domain types used across the application.

export type UserRole = "manager" | "employee";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  workplace_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Workplace {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
}

export type WeekStatus = "draft" | "published";
