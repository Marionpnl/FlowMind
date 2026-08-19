import { Check, Flame, Trash2 } from "lucide-react";
import {
  moduleBadgeClass,
  moduleDotClass,
  moduleTextClass,
} from "@/lib/moduleStyles";
import { calculateStreak, getLast30Days, toLocalDateString } from "@/lib/streak";
import { useHabitStore } from "@/store/habitStore";
import type { IHabit } from "@shared/types";
import { cn } from "@/lib/utils";

export default function HabitCard({ habit }: { habit: IHabit }) {
  const toggleCheck = useHabitStore((s) => s.toggleCheck);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);

  const today = toLocalDateString();
  const isCheckedToday = habit.completedDates.includes(today);
  const streak = calculateStreak(habit.completedDates);
  const last30Days = getLast30Days();

  return (
    <div className="rounded-2xl bg-white px-8 py-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleCheck(habit._id)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
              isCheckedToday
                ? cn(
                    moduleDotClass[habit.module],
                    "border-transparent text-white",
                  )
                : "border-black/15 text-transparent hover:border-black/30",
            )}
            aria-label={isCheckedToday ? "Décocher" : "Cocher"}
          >
            <Check className="h-5 w-5 cursor-pointer" />
          </button>

          <span className="flex h-9 w-9 items-center justify-center rounded-full text-lg">
            {habit.emoji}
          </span>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "font-normal",
                  isCheckedToday &&
                    "text-black/70 text-muted-foreground line-through",
                )}
              >
                {habit.name}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  moduleBadgeClass[habit.module],
                )}
              >
                {habit.module}
              </span>
            </div>
            {habit.goal && (
              <p className="text-xs text-black/60 text-muted-foreground">
                {habit.goal}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-5">
          <span
            className={cn(
              "flex items-center gap-1 text-sm font-mono",
              moduleTextClass[habit.module],
            )}
          >
            <Flame className="h-3.5 w-3.5" />
            {streak}j
          </span>
          <button
            onClick={() => deleteHabit(habit._id)}
            className="text-muted-foreground text-black/50 hover:text-accent-danger"
            aria-label="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[repeat(30,minmax(0,1fr))] gap-1">
        {last30Days.map((date, idx) => {
          const daysAgo = 29 - idx;
          const isDone = habit.completedDates.includes(date);
          return (
            <button
              key={date}
              type="button"
              onClick={() => toggleCheck(habit._id, date)}
              title={daysAgo === 0 ? "Aujourd'hui" : `J-${daysAgo}`}
              aria-label={`${isDone ? "Décocher" : "Cocher"} ${daysAgo === 0 ? "aujourd'hui" : `il y a ${daysAgo} jours`}`}
              className={cn(
                "aspect-square rounded-xs cursor-pointer transition-opacity hover:opacity-70",
                isDone ? moduleDotClass[habit.module] : "bg-black/5",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
