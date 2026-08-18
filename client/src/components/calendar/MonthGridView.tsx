import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DAY_LABELS, getMonthGrid, toDateString } from "@/lib/dateUtils";
import type { DayPlanBlock, IDayPlan } from "@shared/types";

const moduleBgSoft = {
  FlowDay: "bg-flowday-bg text-flowday",
  MindShelf: "bg-mindshelf-bg text-mindshelf",
  SparkTime: "bg-sparktime-bg text-sparktime",
};

interface MonthGridViewProps {
  year: number;
  month: number; // 1-12
  plans: IDayPlan[];
  onDeleteBlock: (blockId: string) => void;
  onEditBlock: (block: DayPlanBlock, date: string) => void;
}

export default function MonthGridView({
  year,
  month,
  plans,
  onDeleteBlock,
  onEditBlock,
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
            className="px-1 py-1.5 text-[9px] text-black/70 font-medium uppercase tracking-widest text-muted-foreground sm:px-3 sm:py-2 sm:text-xs"
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
                className="min-h-16 border-b border-l border-black/5 sm:min-h-28"
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
              className="min-h-16 space-y-1 border-b border-l border-black/5 p-1 sm:min-h-28 sm:p-3.5"
            >
              <p
                className={cn(
                  "text-[10px] text-black/60 font-medium tracking-widest sm:text-xs",
                  isToday &&
                    "flex h-4 w-4 items-center justify-center rounded-full bg-flowday text-white sm:h-5 sm:w-5",
                )}
              >
                {day.getDate()}
              </p>
              {blocks.slice(0, 3).map((block) => (
                <div
                  key={block.id}
                  onClick={() => onEditBlock(block, dateStr)}
                  className={cn(
                    "group relative cursor-pointer truncate rounded px-1 py-0.5 pr-3 text-[8px] font-medium sm:px-1.5 sm:pr-4 sm:text-[10px]",
                    moduleBgSoft[block.module],
                  )}
                >
                  {block.title}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBlock(block.id);
                    }}
                    className="absolute right-0 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/70 p-0.5 group-hover:block"
                    aria-label="Supprimer ce bloc"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              {blocks.length > 3 && (
                <p className="text-[8px] text-muted-foreground sm:text-[10px]">
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
