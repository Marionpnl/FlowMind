export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateStreak(
  completedDates: string[],
  asOf: Date = new Date(),
): number {
  const set = new Set(completedDates);
  const cursor = new Date(asOf);
  let dateStr = toLocalDateString(cursor);

  if (!set.has(dateStr)) {
    cursor.setDate(cursor.getDate() - 1);
    dateStr = toLocalDateString(cursor);
  }

  let streak = 0;
  while (set.has(dateStr)) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
    dateStr = toLocalDateString(cursor);
  }
  return streak;
}

export function getLast30Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(toLocalDateString(d));
  }
  return days;
}
