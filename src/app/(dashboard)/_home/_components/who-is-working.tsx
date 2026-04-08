"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserMinus } from "lucide-react";
import type { WorkingNowEntry } from "@/lib/backend/home";

interface WhoIsWorkingProps {
  initialData: WorkingNowEntry[];
}

export function WhoIsWorking({ initialData }: WhoIsWorkingProps) {
  const [workingNow, setWorkingNow] = useState(initialData);

  useEffect(() => {
    setWorkingNow(initialData);
  }, [initialData]);

  return (
    <Card className="h-full">
      <CardHeader className="border-b bg-slate-50/50 py-3">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-slate-500" />
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Chi sta lavorando adesso
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {workingNow.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="mb-3 rounded-full bg-slate-50 p-3">
              <UserMinus className="size-6 text-slate-300" />
            </div>
            <p className="font-medium text-slate-500">
              Nessun dipendente in turno al momento
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {workingNow.map((entry) => (
              <div
                key={entry.profileId}
                className="flex items-center gap-3 p-4 transition-colors hover:bg-slate-50/50"
              >
                <Avatar className="size-10 border border-slate-100 shadow-xs">
                  <AvatarImage
                    src={entry.avatarUrl ?? undefined}
                    alt={`${entry.firstName} ${entry.lastName}`}
                  />
                  <AvatarFallback className="bg-slate-100 font-medium text-slate-600">
                    {entry.firstName[0]}
                    {entry.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {entry.firstName} {entry.lastName}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <span className="inline-block size-1.5 rounded-full bg-green-500" />
                    {entry.workplaceName}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums text-slate-700">
                    {entry.startTime.substring(0, 5)} - {entry.endTime.substring(0, 5)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
