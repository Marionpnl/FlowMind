import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useHabitStore } from "@/store/habitStore";
import { calculateStreak, getLast30Days } from "@/lib/streak";

export default function HabitsWidget() {
  const habits = useHabitStore((s) => s.habits);
  const fetchHabits = useHabitStore((s) => s.fetchHabits);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const last30Days = getLast30Days();

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-lg italic">
          Habitudes · 30 derniers jours
        </h2>
        <Link
          to="/flowday/habits"
          className="text-xs text-muted-foreground hover:underline"
        >
          Voir tout
        </Link>
      </div>

      {habits.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune habitude pour l'instant.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {habits.slice(0, 3).map((habit) => {
            const streak = calculateStreak(habit.completedDates);
            return (
              <div key={habit._id} className="rounded-xl bg-cream p-3">
                <p className="mb-2 flex items-center gap-1 text-sm font-medium">
                  <span>{habit.emoji}</span>
                  {habit.name}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {streak}j
                  </span>
                </p>
                <div className="flex gap-0.5">
                  {last30Days.map((date) => (
                    <div
                      key={date}
                      className={`h-2 flex-1 rounded-full ${habit.completedDates.includes(date) ? "bg-flowday" : "bg-black/5"}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
