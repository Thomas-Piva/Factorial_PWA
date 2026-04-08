"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getGreetingByHour } from "@/lib/backend/home";

interface GreetingCardProps {
  displayName: string;
  avatarUrl: string | null;
  hour: number;
}

export function GreetingCard({
  displayName,
  avatarUrl,
  hour,
}: GreetingCardProps) {
  const greeting = getGreetingByHour(hour);
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <Card className="overflow-hidden border-none bg-gradient-to-br from-green-50 to-white shadow-sm">
      <CardContent className="flex items-center justify-between gap-4 p-6">
        <div>
          <p className="mb-1 text-sm font-medium text-green-700">
            {greeting},
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            {displayName}!
          </h2>
        </div>
        <Avatar size="lg" className="size-14 shadow-sm ring-4 ring-white">
          <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
          <AvatarFallback className="bg-green-600 text-lg font-bold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
      </CardContent>
    </Card>
  );
}
