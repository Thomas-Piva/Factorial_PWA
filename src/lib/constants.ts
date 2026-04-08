import type { LucideIcon } from "lucide-react";
import {
  Home,
  CalendarDays,
  User,
  CalendarRange,
  CalendarOff,
  Users,
  Settings,
  SlidersHorizontal,
  LogOut,
} from "lucide-react";
import type { UserRole } from "@/types";

export const RUOLI = {
  MANAGER: "manager" as UserRole,
  DIPENDENTE: "dipendente" as UserRole,
} as const;

export const COLORI_TURNI = {
  MATTINA: "bg-blue-100 text-blue-800 border-blue-200",
  POMERIGGIO: "bg-amber-100 text-amber-800 border-amber-200",
  FULL: "bg-green-100 text-green-800 border-green-200",
  RIPOSO: "bg-gray-100 text-gray-500 border-gray-200",
} as const;

export const NEGOZI = {
  NEGOZIO_1: "negozio-1",
  NEGOZIO_2: "negozio-2",
} as const;

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  managerOnly?: boolean;
}

export interface BottomNavItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  isAction?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/turni", label: "Turni", icon: CalendarDays },
  { href: "/profilo", label: "Profilo", icon: User },
  { href: "/calendario", label: "Calendario", icon: CalendarRange },
  { href: "/assenze", label: "Assenze", icon: CalendarOff },
  { href: "/persone", label: "Persone", icon: Users },
  { href: "/impostazioni", label: "Impostazioni", icon: Settings, managerOnly: true },
];

export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { href: "/preferenze", label: "Preferenze", icon: SlidersHorizontal },
  { label: "Esci", icon: LogOut, isAction: true },
];
