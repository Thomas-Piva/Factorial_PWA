import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Supabase admin client with SERVICE_ROLE_KEY.
 * USE ONLY in server-side code (Server Actions, API routes).
 * Never expose this client to the browser.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
