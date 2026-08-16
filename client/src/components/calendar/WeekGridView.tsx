import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DAY_LABELS, getWeekDays, toDateString } from "@/lib/dateUtils";
import type { DayPlanBlock, IDayPlan } from "@shared/types";

const START_HOUR = 7;
const END_HOUR = 15;
const HOUR_HEIGHT = 88;

const moduleBgSoft = {
  FlowDay: "bg-flowday-bg text-flowday",
  MindShelf: "bg-mindshelf-bg text-mindshelf",
  SparkTime: "bg-sparktime-bg text-sparktime",
};

const moduleBgSolid = {
  FlowDay: "bg-flowday text-white",
  MindShelf: "bg-mindshelf text-white",
  SparkTime: "bg-sparktime text-white",
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function addMinutes(time: string, minutes: number): string {
  const total = timeToMinutes(time) + minutes;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface WeekGridViewProps {
  weekStart: Date;
  plans: IDayPlan[];
  onDeleteBlock: (blockId: string) => void;
  onEditBlock: (block: DayPlanBlock, date: string) => void;
}

export default function WeekGridView({
  weekStart,
  plans,
  onDeleteBlock,
  onEditBlock,
}: WeekGridViewProps) {
  const days = getWeekDays(weekStart);
  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i,
  );
  const planByDate = new Map(plans.map((p) => [p.date, p]));

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* En-têtes des jours */}
      <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-black/5">
        <div />
        {days.map((day, i) => (
          <div key={i} className="border-l border-black/5 px-3 py-3">
            <p className="text-xs text-black/60 font-medium uppercase tracking-widest text-muted-foreground">
              {DAY_LABELS[i]}
            </p>
            <p className="pt-1 font-mono text-sm text-black/70 tracking-widest font-medium">
              {day.getDate()}
            </p>
          </div>
        ))}
      </div>

      {/* Grille horaire */}
      <div className="grid grid-cols-[64px_repeat(7,1fr)]">
        {/* Colonne des heures — mêmes bordures que les colonnes de jours pour un alignement parfait */}
        <div>
          {hours.map((h, idx) => (
            <div
              key={h}
              style={{ height: HOUR_HEIGHT }}
              className={cn(
                "px-2 pt-1",
                idx !== 0 && "border-t border-black/5",
              )}
            >
              <span className="font-mono text-xs text-black/60 text-muted-foreground">
                {String(h).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>

        {/* Colonnes des jours */}
        {days.map((day, dayIdx) => {
          const dateStr = toDateString(day);
          const plan = planByDate.get(dateStr);
          const blocks = plan?.blocks ?? [];

          return (
            <div key={dayIdx} className="relative border-l border-black/5">
              {hours.map((h, idx) => (
                <div
                  key={h}
                  style={{ height: HOUR_HEIGHT }}
                  className={cn(idx !== 0 && "border-t border-black/5")}
                />
              ))}

              {blocks.map((block) => {
                const startMinutes =
                  timeToMinutes(block.time) - START_HOUR * 60;
                const top = (startMinutes / 60) * HOUR_HEIGHT;
                const height = (block.duration / 60) * HOUR_HEIGHT;
                const isSolid = block.duration > 60;
                const isCompact = height < 44;
                const timeColorClass = isSolid
                  ? "text-white/80"
                  : "text-black/60";

                return (
                  <div
                    key={block.id}
                    style={{ top, height }}
                    onClick={() => onEditBlock(block, dateStr)}
                    className={cn(
                      "group absolute left-1 right-1 cursor-pointer overflow-hidden rounded-lg px-2",
                      isCompact ? "flex items-center py-0" : "py-1",
                      isSolid
                        ? moduleBgSolid[block.module]
                        : moduleBgSoft[block.module],
                    )}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBlock(block.id);
                      }}
                      className={cn(
                        "absolute right-1 top-1 hidden rounded-full p-0.5 group-hover:block",
                        isSolid ? "hover:bg-white/20" : "hover:bg-black/10",
                      )}
                      aria-label="Supprimer ce bloc"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {isCompact ? (
                      <p className="truncate text-[11px] font-medium">
                        {block.title}{" "}
                        <span
                          className={cn(
                            "font-mono font-normal",
                            timeColorClass,
                          )}
                        >
                          · {block.time}
                        </span>
                      </p>
                    ) : (
                      <>
                        <p className="truncate text-xs font-medium leading-tight">
                          {block.title}
                        </p>
                        <p
                          className={cn(
                            "truncate font-mono text-[10px] leading-tight",
                            timeColorClass,
                          )}
                        >
                          {block.time} -{" "}
                          {addMinutes(block.time, block.duration)}
                        </p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
