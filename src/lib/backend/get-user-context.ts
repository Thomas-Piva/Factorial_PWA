import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/types";
import type { Database } from "@/types/database";

export interface WorkplaceAssignment {
  id: string;
  workplaceId: string;
  workplaceName: string;
  contractType: string | null;
  contractStatus: string;
  weeklyHours: number | null;
  hiredAt: string | null;
}

export interface UserContext {
  profile: Profile;
  displayName: string;
  workplaceAssignments: WorkplaceAssignment[];
  primaryWorkplaceId: string | null;
}

export async function getUserContext(
  supabase: SupabaseClient<Database>,
): Promise<UserContext | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) return null;

  const { data: workplaceRows } = await supabase
    .from("employee_workplaces")
    .select(
      "id, contract_type, contract_status, weekly_hours, hired_at, workplace_id, workplaces(id, name)",
    )
    .eq("profile_id", user.id);

  const rows = workplaceRows ?? [];

  const workplaceAssignments: WorkplaceAssignment[] = rows.map((row) => {
    const wp = row.workplaces as unknown as { id: string; name: string } | null;
    return {
      id: row.id,
      workplaceId: row.workplace_id,
      workplaceName: wp?.name ?? "",
      contractType: row.contract_type,
      contractStatus: row.contract_status,
      weeklyHours: row.weekly_hours,
      hiredAt: row.hired_at,
    };
  });

  return {
    profile: profile as unknown as Profile,
    displayName: profile.preferred_name || profile.first_name,
    workplaceAssignments,
    primaryWorkplaceId: workplaceAssignments[0]?.workplaceId ?? null,
  };
}
