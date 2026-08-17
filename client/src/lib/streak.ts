export function calculateStreak(
  completedDates: string[],
  asOf: Date = new Date(),
): number {
  const set = new Set(completedDates);
  const cursor = new Date(asOf);
  let dateStr = cursor.toISOString().split("T")[0];

  if (!set.has(dateStr)) {
    cursor.setDate(cursor.getDate() - 1);
    dateStr = cursor.toISOString().split("T")[0];
  }

  let streak = 0;
  while (set.has(dateStr)) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
    dateStr = cursor.toISOString().split("T")[0];
  }
  return streak;
}

export function getLast30Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}
