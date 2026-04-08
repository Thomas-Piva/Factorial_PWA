import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/backend/get-user-context";
import { getTodayShift, getWorkingNow } from "@/lib/backend/home";
import { PageHeader } from "@/components/layout/page-header";
import { GreetingCard } from "./_home/_components/greeting-card";
import { TodayShiftCard } from "./_home/_components/today-shift-card";
import { WhoIsWorking } from "./_home/_components/who-is-working";

function getRomeTime() {
  const now = new Date();
  const romeDate = now
    .toLocaleDateString("en-CA", { timeZone: "Europe/Rome" });
  const romeTime = now.toLocaleTimeString("it-IT", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const romeHour = parseInt(
    now.toLocaleTimeString("it-IT", {
      timeZone: "Europe/Rome",
      hour: "2-digit",
      hour12: false,
    }),
  );
  return { romeDate, romeTime, romeHour };
}

export default async function HomePage() {
  const supabase = await createClient();
  const ctx = await getUserContext(supabase);

  if (!ctx) {
    redirect("/login");
  }

  const { romeDate, romeTime, romeHour } = getRomeTime();

  const [todayShift, workingNow] = await Promise.all([
    getTodayShift(supabase, ctx.profile.id, romeDate),
    getWorkingNow(supabase, romeDate, romeTime),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />

      <GreetingCard
        displayName={ctx.displayName}
        avatarUrl={ctx.profile.avatar_url}
        hour={romeHour}
      />

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <TodayShiftCard shift={todayShift} />
        <WhoIsWorking initialData={workingNow} />
      </div>
    </div>
  );
}
