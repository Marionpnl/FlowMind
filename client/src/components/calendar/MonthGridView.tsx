import { cn } from "@/lib/utils";
import { DAY_LABELS, getMonthGrid, toDateString } from "@/lib/dateUtils";
import type { IDayPlan } from "@shared/types";

const moduleBgSoft = {
  FlowDay: "bg-flowday-bg text-flowday",
  MindShelf: "bg-mindshelf-bg text-mindshelf",
  SparkTime: "bg-sparktime-bg text-sparktime",
};

interface MonthGridViewProps {
  year: number;
  month: number; // 1-12
  plans: IDayPlan[];
}

export default function MonthGridView({
  year,
  month,
  plans,
}: MonthGridViewProps) {
  const grid = getMonthGrid(year, month);
  const planByDate = new Map(plans.map((p) => [p.date, p]));
  const today = toDateString(new Date());

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="grid grid-cols-7 border-b border-black/5">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-3 py-2 text-xs text-black/70 font-medium uppercase tracking-widest text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {grid.map((day, idx) => {
          if (!day) {
            return (
              <div
                key={idx}
                className="min-h-28 border-b border-l border-black/5"
              />
            );
          }

          const dateStr = toDateString(day);
          const plan = planByDate.get(dateStr);
          const blocks = plan?.blocks ?? [];
          const isToday = dateStr === today;

          return (
            <div
              key={idx}
              className="min-h-28 space-y-1 border-b border-l border-black/5 p-3.5"
            >
              <p
                className={cn(
                  "text-xs text-black/60 font-medium tracking-widest",
                  isToday &&
                    "flex h-5 w-5 items-center justify-center rounded-full bg-flowday text-white",
                )}
              >
                {day.getDate()}
              </p>
              {blocks.slice(0, 3).map((block) => (
                <p
                  key={block.id}
                  className={cn(
                    "truncate rounded px-1.5 py-0.5 text-[10px] font-medium",
                    moduleBgSoft[block.module],
                  )}
                >
                  {block.title}
                </p>
              ))}
              {blocks.length > 3 && (
                <p className="text-[10px] text-muted-foreground">
                  +{blocks.length - 3} de plus
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
