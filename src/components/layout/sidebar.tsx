"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, BOTTOM_NAV_ITEMS, RUOLI } from "@/lib/constants";
import { SidebarNavItem } from "./sidebar-nav-item";
import { SidebarUserMenu } from "./sidebar-user-menu";
import { useAuth } from "@/hooks/use-auth";
import type { Profile } from "@/types";

interface SidebarProps {
  profile: Profile;
  displayName: string;
}

export function SidebarContent({
  profile,
  displayName,
  isMobile,
}: SidebarProps & { isMobile?: boolean }) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const filteredNavItems = NAV_ITEMS.filter(
    (item) => !item.managerOnly || profile.role === RUOLI.MANAGER,
  );

  return (
    <div className="flex h-full flex-col">
      {!isMobile && (
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-green-600">
              <span className="text-xl font-bold leading-none text-white">
                E
              </span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">
              Erboristerie
            </span>
          </Link>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-2">
        <div className="space-y-1">
          {filteredNavItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </div>
      </nav>

      <div
        className={cn(
          "border-t border-slate-100 bg-slate-50/50 p-4",
          isMobile && "mt-auto",
        )}
      >
        <div className="mb-4 space-y-1">
          {BOTTOM_NAV_ITEMS.map((item) =>
            item.isAction ? (
              <button
                key={item.label}
                onClick={signOut}
                className="flex w-full items-center gap-3 rounded-md px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
              >
                <item.icon className="size-[18px]" />
                <span>{item.label}</span>
              </button>
            ) : (
              <Link
                key={item.href}
                href={item.href || "#"}
                className={cn(
                  "flex items-center gap-3 rounded-md px-4 py-2 text-sm transition-colors",
                  pathname === item.href
                    ? "bg-slate-100 font-medium text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <item.icon className="size-[18px]" />
                <span>{item.label}</span>
              </Link>
            ),
          )}
        </div>
        <SidebarUserMenu
          profile={profile}
          displayName={displayName}
          onSignOut={signOut}
        />
      </div>
    </div>
  );
}

export function Sidebar({ profile, displayName }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[220px] flex-col border-r border-slate-200 bg-white lg:flex">
      <SidebarContent profile={profile} displayName={displayName} />
    </aside>
  );
}
