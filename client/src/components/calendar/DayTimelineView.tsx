import { cn } from "@/lib/utils";
import type { DayPlanBlock } from "@shared/types";

const START_HOUR = 7;
const END_HOUR = 19;
const HOUR_HEIGHT = 64; // px par heure

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getBlockPosition(block: DayPlanBlock) {
  const startMinutes = timeToMinutes(block.time) - START_HOUR * 60;
  const top = (startMinutes / 60) * HOUR_HEIGHT;
  const height = (block.duration / 60) * HOUR_HEIGHT;
  return { top, height: Math.max(height, 24) }; // hauteur minimale pour rester lisible
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
}

export default function DayTimelineView({ blocks }: DayTimelineViewProps) {
  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i,
  );

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="relative flex">
        {/* Colonne des heures */}
        <div className="w-16 shrink-0">
          {hours.map((h) => (
            <div key={h} style={{ height: HOUR_HEIGHT }} className="relative">
              <span className="absolute -top-2 font-mono text-xs text-muted-foreground">
                {String(h).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>

        {/* Zone des blocs */}
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
            const isBig = height >= 48;
            return (
              <div
                key={block.id}
                style={{ top, height }}
                className={cn(
                  "absolute left-1 right-1 overflow-hidden rounded-lg px-3 py-1.5",
                  isBig
                    ? moduleBgSolid[block.module]
                    : moduleBgSoft[block.module],
                )}
              >
                <p className="truncate text-sm font-medium">{block.title}</p>
                {height > 32 && (
                  <p
                    className={cn(
                      "text-xs",
                      isBig ? "text-white/80" : "opacity-70",
                    )}
                  >
                    {block.time} - {addMinutes(block.time, block.duration)}
                  </p>
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
