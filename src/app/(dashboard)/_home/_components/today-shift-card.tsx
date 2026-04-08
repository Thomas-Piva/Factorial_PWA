import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarDays, CalendarOff, Coffee } from "lucide-react";
import type { TodayShiftResult } from "@/lib/backend/home";

interface TodayShiftCardProps {
  shift: TodayShiftResult | null;
}

export function TodayShiftCard({ shift }: TodayShiftCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="border-b bg-slate-50/50 py-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-slate-500" />
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Il tuo turno oggi
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {!shift ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="mb-3 rounded-full bg-slate-100 p-3">
              <CalendarOff className="size-6 text-slate-400" />
            </div>
            <p className="font-medium text-slate-600">
              Nessun turno assegnato per oggi
            </p>
          </div>
        ) : shift.isRestDay ? (
          <div className="flex items-center gap-4 rounded-xl border border-pink-100 bg-pink-50 p-4">
            <div className="rounded-full bg-white p-2.5 shadow-sm">
              <Coffee className="size-6 text-pink-500" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight text-pink-900">
                Giorno di riposo
              </p>
              <p className="mt-0.5 text-sm text-pink-700/80">
                Goditi la giornata libera!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                {shift.shiftName || "Turno Standard"}
              </h3>
              <p className="text-lg font-bold tabular-nums text-green-600">
                {shift.startTime?.substring(0, 5)} - {shift.endTime?.substring(0, 5)}
              </p>
            </div>

            {shift.workplaceName && (
              <div className="flex items-center gap-2 border-t pt-4">
                <div
                  className="size-3 rounded-full border border-white shadow-xs"
                  style={{
                    backgroundColor: shift.workplaceColor || "#16a34a",
                  }}
                />
                <span className="font-semibold text-slate-700">
                  {shift.workplaceName}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
