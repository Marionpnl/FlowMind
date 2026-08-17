import type { DayPlanBlock } from "@shared/types";

export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = sunday, 1 = monday, ...
  const diff = day === 0 ? -6 : 1 - day; // move to the previous monday
  d.setDate(d.getDate() + diff);
  return d;
}

export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0 min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m.toString().padStart(2, "0")}`;
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export const DAY_LABELS = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

export function getMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const startWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // 0 = lundi
  const daysInMonth = lastDay.getDate();

  const grid: (Date | null)[] = [];

  // Cases vides avant le 1er du mois
  for (let i = 0; i < startWeekday; i++) {
    grid.push(null);
  }

  // Les jours réels du mois
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push(new Date(year, month - 1, d));
  }

  return grid;
}

export const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export function formatPeriodLabel(
  view: "day" | "week" | "month",
  date: Date,
): string {
  if (view === "day") {
    const s = date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  if (view === "week") {
    const s = getMonday(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
    });
    return `Semaine du ${s}`;
  }
  return `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}

export function summarizeBlocks(blocks: DayPlanBlock[]): string {
  const focusMinutes = blocks
    .filter((b) => b.module === "FlowDay")
    .reduce((sum, b) => sum + b.duration, 0);
  const focusLabel =
    focusMinutes > 0 ? ` - ${formatDuration(focusMinutes)} de travail focus` : "";
  return `${blocks.length} blocs${focusLabel}`;
}
