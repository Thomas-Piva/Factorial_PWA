"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/constants";

interface SidebarNavItemProps {
  item: NavItem;
  isActive: boolean;
}

export function SidebarNavItem({ item, isActive }: SidebarNavItemProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-4 py-2 text-sm rounded-r-md transition-colors duration-200 border-l-[3px]",
        isActive
          ? "border-green-600 bg-green-50 text-green-700 font-medium"
          : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon
        className={cn(
          "size-[18px]",
          isActive ? "text-green-600" : "text-slate-500",
        )}
      />
      <span>{item.label}</span>
    </Link>
  );
}
