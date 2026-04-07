"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/types";

// ---------------------------------------------------------------------------
// Public contract
// ---------------------------------------------------------------------------

/**
 * Props for the {@link RoleGate} component.
 *
 * @example
 * ```tsx
 * <RoleGate allowedRoles={[RUOLI.MANAGER]} fallback={<Unauthorized />}>
 *   <ManagerDashboard />
 * </RoleGate>
 * ```
 */
export interface RoleGateProps {
  /** Roles that are permitted to see the protected children. */
  allowedRoles: UserRole[];
  /** Content shown only to authorised users. */
  children: React.ReactNode;
  /**
   * Content shown to unauthorised / unauthenticated users.
   * Defaults to `null` (renders nothing).
   */
  fallback?: React.ReactNode;
  /**
   * When provided, `router.push` is called with this path whenever the
   * current user is not authorised. Renders nothing during the redirect.
   */
  redirectTo?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Conditionally renders `children` based on the authenticated user's role.
 *
 * Behaviour matrix:
 * - `loading === true`           → renders nothing (auth state not yet known)
 * - not authenticated            → renders `fallback`, or redirects to `redirectTo`
 * - role not in `allowedRoles`   → renders `fallback`, or redirects to `redirectTo`
 * - role in `allowedRoles`       → renders `children`
 *
 * `redirectTo` takes precedence over `fallback`: when both are provided and
 * the user is not authorised, the router push fires and nothing is rendered.
 */
export function RoleGate({
  allowedRoles,
  children,
  fallback = null,
  redirectTo,
}: RoleGateProps): React.ReactNode {
  const { loading, isAuthenticated, role } = useAuth();
  const router = useRouter();

  const isAuthorised: boolean =
    isAuthenticated && role !== null && allowedRoles.includes(role);

  useEffect(() => {
    if (!loading && !isAuthorised && redirectTo !== undefined) {
      router.push(redirectTo);
    }
  }, [loading, isAuthorised, redirectTo, router]);

  if (loading) {
    return null;
  }

  if (!isAuthorised) {
    return redirectTo !== undefined ? null : fallback;
  }

  return children;
}
