import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface TodayShiftResult {
  id: string;
  shiftName: string | null;
  startTime: string | null;
  endTime: string | null;
  isRestDay: boolean;
  workplaceName: string | null;
  workplaceColor: string | null;
}

export interface WorkingNowEntry {
  profileId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  startTime: string;
  endTime: string;
  workplaceName: string | null;
}

export function getGreetingByHour(hour: number): string {
  if (hour < 12) return "Buongiorno";
  if (hour < 18) return "Buon pomeriggio";
  return "Buonasera";
}

export async function getTodayShift(
  supabase: SupabaseClient<Database>,
  userId: string,
  today: string,
): Promise<TodayShiftResult | null> {
  const { data, error } = await supabase
    .from("shifts")
    .select(
      "id, shift_name, start_time, end_time, is_rest_day, shift_weeks!inner(status), workplaces(name, color)",
    )
    .eq("profile_id", userId)
    .eq("date", today)
    .eq("shift_weeks.status", "pubblicato")
    .maybeSingle();

  if (error || !data) return null;

  const wp = data.workplaces as unknown as {
    name: string;
    color: string | null;
  } | null;

  return {
    id: data.id,
    shiftName: data.shift_name,
    startTime: data.start_time,
    endTime: data.end_time,
    isRestDay: data.is_rest_day,
    workplaceName: wp?.name ?? null,
    workplaceColor: wp?.color ?? null,
  };
}

export async function getWorkingNow(
  supabase: SupabaseClient<Database>,
  today: string,
  nowTime: string,
): Promise<WorkingNowEntry[]> {
  const { data, error } = await supabase
    .from("shifts")
    .select(
      "start_time, end_time, shift_weeks!inner(status), profiles!inner(id, first_name, last_name, avatar_url), workplaces(name)",
    )
    .eq("date", today)
    .eq("is_rest_day", false)
    .eq("shift_weeks.status", "pubblicato")
    .lte("start_time", nowTime)
    .gt("end_time", nowTime);

  if (error || !data) return [];

  return data.map((row) => {
    const profile = row.profiles as unknown as {
      id: string;
      first_name: string;
      last_name: string;
      avatar_url: string | null;
    };
    const wp = row.workplaces as unknown as { name: string } | null;

    return {
      profileId: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      avatarUrl: profile.avatar_url,
      startTime: row.start_time!,
      endTime: row.end_time!,
      workplaceName: wp?.name ?? null,
    };
  });
}
