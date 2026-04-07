import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Supabase admin client with SERVICE_ROLE_KEY.
 * USE ONLY in server-side code (Server Actions, API routes).
 * Never expose this client to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Configurazione mancante: NEXT_PUBLIC_SUPABASE_URL e/o SUPABASE_SERVICE_ROLE_KEY " +
        "non sono definite. Verificare le variabili d'ambiente del server.",
    );
  }

  return createClient<Database>(url, key);
}
