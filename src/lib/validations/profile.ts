import { z } from "zod";

/**
 * Runtime validation schema for the `profiles` table row.
 *
 * Used in {@link fetchProfile} to validate the Supabase response before
 * casting to {@link Profile}, protecting against schema drift or malformed data
 * reaching the application layer.
 */
export const profileSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  full_name: z.string(),
  phone: z.string().nullable(),
  role: z.enum(["manager", "employee"]),
  workplace_id: z.uuid().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ProfileFromSchema = z.infer<typeof profileSchema>;
