import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Updates the Supabase session on every request.
 * Used as a helper in the root middleware.ts.
 */
export async function updateSession(request: NextRequest) {
  // H2: explicit env var guard — fail fast instead of passing undefined via !
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Configurazione mancante: NEXT_PUBLIC_SUPABASE_URL e/o NEXT_PUBLIC_SUPABASE_ANON_KEY " +
        "non sono definite. Verificare le variabili d'ambiente del server.",
    );
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // CRITICAL: do not remove — needed to refresh the session token
  await supabase.auth.getUser();

  return supabaseResponse;
}
