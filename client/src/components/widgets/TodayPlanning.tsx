import { Check } from "lucide-react";
import { moduleBadgeClass, moduleDotClass } from "@/lib/moduleStyles";
import { cn } from "@/lib/utils";
import type { DayPlanBlock } from "@shared/types";

interface TodayPlanningProps {
  blocks: DayPlanBlock[];
  onToggleBlock: (blockId: string) => void;
}

export default function TodayPlanning({
  blocks = [],
  onToggleBlock,
}: TodayPlanningProps) {
  const totalFocusMinutes = blocks
    .filter((b) => b.module === "FlowDay")
    .reduce((sum, b) => sum + b.duration, 0);

  const hours = Math.floor(totalFocusMinutes / 60);
  const minutes = totalFocusMinutes % 60;
  const focusLabel =
    totalFocusMinutes > 0
      ? `${hours > 0 ? `${hours}h` : ""}${minutes > 0 ? `${minutes.toString().padStart(2, "0")}` : ""} de travail focus`
      : null;

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-display text-2xl italic">Aujourd'hui</h2>
        <p className="text-xs text-muted-foreground">
          {blocks.length} blocs{focusLabel ? ` - ${focusLabel}` : ""}
        </p>
      </div>

      {blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun planning généré pour aujourd'hui. Décris ta journée ci-dessus
          pour commencer.
        </p>
      ) : (
        <ul className="relative space-y-3">
          <div className="absolute left-[47px] top-2 bottom-2 w-px bg-black/10" />

          {blocks.map((block) => (
            <li key={block.id} className="relative flex items-start gap-3">
              <span className="w-12 shrink-0 pt-4 font-mono text-xs text-muted-foreground">
                {block.time}
              </span>
              <span
                className={cn(
                  "relative z-10 mt-4 mr-4 h-3 w-3 shrink-0 rounded-full",
                  moduleDotClass[block.module],
                )}
              />
              <div className="flex-1 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => onToggleBlock(block.id)}
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                        block.done
                          ? "border-flowday bg-flowday text-white"
                          : "border-black/20 text-transparent",
                      )}
                    >
                      <Check className="h-3 w-3 cursor-pointer" />
                    </button>
                    <div>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          block.done && "text-muted-foreground line-through",
                        )}
                      >
                        {block.title}
                      </p>
                      <p className="text-xs text-black/70 text-muted-foreground">
                        {block.duration ? `${block.duration} min` : ""} ·{" "}
                        {block.subtitle}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                      moduleBadgeClass[block.module],
                    )}
                  >
                    {block.module}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
