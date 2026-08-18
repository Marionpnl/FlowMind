import { useEffect } from "react";
import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { useHabitStore } from "@/store/habitStore";
import { calculateStreak, getLast30Days } from "@/lib/streak";
import { moduleDotClass } from "@/lib/moduleStyles";
import { cn } from "@/lib/utils";

const moduleBgSoft = {
  FlowDay: "bg-flowday-bg",
  MindShelf: "bg-mindshelf-bg",
  SparkTime: "bg-sparktime-bg",
};

const moduleTextClass = {
  FlowDay: "text-flowday",
  MindShelf: "text-mindshelf",
  SparkTime: "text-sparktime",
};

interface HabitsWidgetProps {
  layout?: "row" | "column" | "responsive";
}

export default function HabitsWidget({
  layout = "row",
}: HabitsWidgetProps) {
  const habits = useHabitStore((s) => s.habits);
  const fetchHabits = useHabitStore((s) => s.fetchHabits);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const last30Days = getLast30Days();

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          <TrendingUp className="mr-1 h-4 w-4 text-flowday" />
          Habitudes - 30 derniers jours
        </h2>
        <Link
          to="/flowday/habits"
          className="text-[10px] text-black/70 text-muted-foreground hover:underline"
        >
          Voir tout
        </Link>
      </div>

      {habits.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune habitude pour l'instant.
        </p>
      ) : (
        <div
          className={cn(
            layout === "row" && "grid grid-cols-3 gap-3",
            layout === "column" && "space-y-3",
            layout === "responsive" && "space-y-3 sm:grid sm:grid-cols-3 sm:gap-3 sm:space-y-0",
          )}
        >
          {habits.slice(0, 3).map((habit) => {
            const streak = calculateStreak(habit.completedDates);
            return (
              <div
                key={habit._id}
                className="rounded-xl bg-cream-secondary p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-lg text-sm",
                        moduleBgSoft[habit.module],
                      )}
                    >
                      {habit.emoji}
                    </span>
                    <span className="text-xs font-medium">{habit.name}</span>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-mono font-medium",
                      moduleTextClass[habit.module],
                    )}
                  >
                    {streak}j
                  </span>
                </div>
                <div className="flex items-end gap-[3px]">
                  {last30Days.map((date) => (
                    <div
                      key={date}
                      className={cn(
                        "h-6 flex-1 rounded-full",
                        habit.completedDates.includes(date)
                          ? moduleDotClass[habit.module]
                          : "bg-black/10",
                      )}
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
