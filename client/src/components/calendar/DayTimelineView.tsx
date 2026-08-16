import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DayPlanBlock } from "@shared/types";

const START_HOUR = 7;
const END_HOUR = 19;
const HOUR_HEIGHT = 88; // px par heure — 30 min = 44px, assez pour 2 lignes compactes

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getBlockPosition(block: DayPlanBlock) {
  const startMinutes = timeToMinutes(block.time) - START_HOUR * 60;
  const top = (startMinutes / 60) * HOUR_HEIGHT;
  const height = (block.duration / 60) * HOUR_HEIGHT;
  return { top, height }; // jamais de minimum forcé : la hauteur reste toujours fidèle à la vraie durée
}

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

interface DayTimelineViewProps {
  blocks: DayPlanBlock[];
  onDeleteBlock: (blockId: string) => void;
}

export default function DayTimelineView({
  blocks,
  onDeleteBlock,
}: DayTimelineViewProps) {
  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i,
  );

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="relative flex">
        <div className="w-16 shrink-0">
          {hours.map((h) => (
            <div key={h} style={{ height: HOUR_HEIGHT }} className="relative">
              <span className="absolute -top-2 font-mono text-xs text-black/60 text-muted-foreground">
                {String(h).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>

        <div className="relative flex-1 border-l border-black/10">
          {hours.map((h) => (
            <div
              key={h}
              style={{ height: HOUR_HEIGHT }}
              className="border-b border-black/5"
            />
          ))}

          {blocks.map((block) => {
            const { top, height } = getBlockPosition(block);
            const isSolid = block.duration > 60;
            const isCompact = height < 44; // moins de 30 min : affichage réduit
            const timeColorClass = isSolid ? "text-white/80" : "text-black/60";

            return (
              <div
                key={block.id}
                style={{ top, height }}
                className={cn(
                  "group absolute left-1 right-1 overflow-hidden rounded-lg px-2",
                  isCompact ? "flex items-center py-0" : "py-1",
                  isSolid
                    ? moduleBgSolid[block.module]
                    : moduleBgSoft[block.module],
                )}
              >
                <button
                  onClick={() => onDeleteBlock(block.id)}
                  className={cn(
                    "absolute right-1 top-1 hidden rounded-full p-0.5 group-hover:block",
                    isSolid ? "hover:bg-white/20" : "hover:bg-black/10",
                  )}
                  aria-label="Supprimer ce bloc"
                >
                  <X className="h-3 w-3" />
                </button>
                {isCompact ? (
                  <p className="truncate text-xs font-medium">
                    {block.title}{" "}
                    <span
                      className={cn("font-mono font-normal", timeColorClass)}
                    >
                      · {block.time}
                    </span>
                  </p>
                ) : (
                  <>
                    <p className="truncate text-sm font-medium leading-tight">
                      {block.title}
                    </p>
                    <p
                      className={cn(
                        "font-mono text-xs leading-tight",
                        timeColorClass,
                      )}
                    >
                      {block.time} - {addMinutes(block.time, block.duration)}
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function addMinutes(time: string, minutes: number): string {
  const total = timeToMinutes(time) + minutes;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
