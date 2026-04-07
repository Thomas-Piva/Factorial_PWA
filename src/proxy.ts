import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// H5: /registrazione is a manager-only route — removed from PUBLIC_ROUTES
const PUBLIC_ROUTES = ["/login", "/reset-password"];
const MANAGER_ROUTES = ["/registrazione", "/export", "/api/export/pdf"];

export async function proxy(request: NextRequest) {
  // H2: fail fast if required env vars are missing rather than passing
  // undefined (cast as string via !) to createServerClient
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

  // CRITICAL: must call getUser() immediately after createServerClient
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Allow public routes without auth check
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  if (isPublic) return supabaseResponse;

  // Redirect unauthenticated users to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Check manager-only routes (H5: now includes /registrazione)
  const isManagerRoute = MANAGER_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  if (isManagerRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "manager") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      return NextResponse.redirect(redirectUrl);
    }
  }

  // CRITICAL: return supabaseResponse intact to preserve session cookies
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
