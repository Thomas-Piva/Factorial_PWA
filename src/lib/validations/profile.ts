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
  first_name: z.string(),
  last_name: z.string(),
  preferred_name: z.string().nullable(),
  gender: z.string().nullable(),
  phone: z.string().nullable(),
  role: z.enum(["manager", "dipendente"]),
  avatar_url: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ProfileFromSchema = z.infer<typeof profileSchema>;
