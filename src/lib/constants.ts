import type { UserRole } from "@/types";

export const RUOLI = {
  MANAGER: "manager" as UserRole,
  EMPLOYEE: "employee" as UserRole,
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

export const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "Home" },
  { href: "/turni", label: "Turni", icon: "Calendar" },
  { href: "/assenze", label: "Assenze", icon: "CalendarOff" },
  { href: "/calendario", label: "Calendario", icon: "CalendarDays" },
  { href: "/persone", label: "Persone", icon: "Users", managerOnly: true },
  { href: "/export", label: "Export PDF", icon: "FileDown", managerOnly: true },
] as const;
