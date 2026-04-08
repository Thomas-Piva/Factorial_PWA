"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { SlidersHorizontal, LogOut, ChevronUp } from "lucide-react";
import { RUOLI } from "@/lib/constants";
import type { Profile } from "@/types";

interface SidebarUserMenuProps {
  profile: Profile;
  displayName: string;
  onSignOut?: () => void;
}

export function SidebarUserMenu({
  profile,
  displayName,
  onSignOut,
}: SidebarUserMenuProps) {
  const initials = displayName.charAt(0).toUpperCase();
  const isManager = profile.role === RUOLI.MANAGER;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left outline-none transition-colors hover:bg-slate-50">
        <Avatar size="lg" className="border border-slate-200">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback className="bg-green-100 font-semibold text-green-700">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">
            {displayName}
          </p>
          <span
            className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium capitalize ${
              isManager
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {profile.role}
          </span>
        </div>
        <ChevronUp className="size-4 text-slate-400" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="top" className="mb-2 w-56">
        <Link href="/preferenze">
          <DropdownMenuItem className="cursor-pointer">
            <SlidersHorizontal className="mr-2 size-4" />
            <span>Preferenze</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut} className="cursor-pointer">
          <LogOut className="mr-2 size-4" />
          <span>Esci</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
