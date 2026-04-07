import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  getISOWeek,
  parseISO,
  isToday,
  isSameDay,
} from "date-fns";
import { it } from "date-fns/locale";

const LOCALE = it;

export function formatDate(date: Date | string, pattern: string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern, { locale: LOCALE });
}

export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday
}

export function getWeekEnd(date: Date): Date {
  return endOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function getWeekNumber(date: Date): number {
  return getISOWeek(date);
}

export function nextWeek(date: Date): Date {
  return addWeeks(date, 1);
}

export function prevWeek(date: Date): Date {
  return subWeeks(date, 1);
}

export { isToday, isSameDay, parseISO };
