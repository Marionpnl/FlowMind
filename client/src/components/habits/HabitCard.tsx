import { Check, Flame, X } from "lucide-react";
import {
  moduleBadgeClass,
  moduleDotClass,
  moduleTextClass,
} from "@/lib/moduleStyles";
import {
  calculateStreak,
  getLast30Days,
  toLocalDateString,
} from "@/lib/streak";
import { useHabitStore } from "@/store/habitStore";
import type { IHabit } from "@shared/types";
import { cn } from "@/lib/utils";
import { useLongPress } from "@/lib/useLongPress";

export default function HabitCard({ habit }: { habit: IHabit }) {
  const toggleCheck = useHabitStore((s) => s.toggleCheck);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);
  const [setLongPressRef, longPressRevealed, longPressTouchHandlers] = useLongPress<HTMLDivElement>();

  const today = toLocalDateString();
  const isCheckedToday = habit.completedDates.includes(today);
  const streak = calculateStreak(habit.completedDates);
  const last30Days = getLast30Days();

  return (
    <div
      ref={setLongPressRef}
      {...longPressTouchHandlers}
      className="group relative rounded-2xl bg-white px-4 py-4 shadow-sm sm:px-8 sm:py-6"
    >
      <button
        onClick={() => deleteHabit(habit._id)}
        className={cn(
          "absolute -right-2 -top-2 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-black/10 bg-white text-black/40 shadow-sm hover:border-accent-danger/30 hover:text-accent-danger group-hover:flex",
          longPressRevealed && "flex",
        )}
        aria-label="Supprimer l'habitude"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            onClick={() => toggleCheck(habit._id)}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors sm:h-9 sm:w-9",
              isCheckedToday
                ? cn(
                    moduleDotClass[habit.module],
                    "border-transparent text-white",
                  )
                : "border-black/15 text-transparent hover:border-black/30",
            )}
            aria-label={isCheckedToday ? "Décocher" : "Cocher"}
          >
            <Check className="h-4 w-4 cursor-pointer sm:h-5 sm:w-5" />
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-1.5 md:gap-x-2.5 gap-y-1">
              <span className="text-sm shrink-0">{habit.emoji}</span>
              <span
                className={cn(
                  "truncate text-sm font-normal sm:text-base",
                  isCheckedToday &&
                    "text-black/70 text-muted-foreground line-through",
                )}
              >
                {habit.name}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  moduleBadgeClass[habit.module],
                )}
              >
                {habit.module}
              </span>
            </div>
            {habit.goal && (
              <p className="truncate text-xs text-black/60 text-muted-foreground">
                {habit.goal}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-5">
          <span
            className={cn(
              "flex items-center gap-1 font-mono text-xs sm:text-sm",
              moduleTextClass[habit.module],
            )}
          >
            <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            {streak}j
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-end gap-0.5 sm:mt-4 sm:gap-1">
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
                "h-5 lg:h-8 flex-1 rounded-full lg:rounded-xl cursor-pointer transition-opacity hover:opacity-70 sm:h-6",
                isDone ? moduleDotClass[habit.module] : "bg-black/5",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
