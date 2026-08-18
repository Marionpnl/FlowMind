import { Check, Trash2 } from "lucide-react";
import { moduleBadgeClass, moduleDotClass } from "@/lib/moduleStyles";
import { cn } from "@/lib/utils";
import type { DayPlanBlock } from "@shared/types";

interface TodayPlanningProps {
  blocks: DayPlanBlock[];
  onToggleBlock: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onEditBlock: (block: DayPlanBlock) => void;
}

export default function TodayPlanning({
  blocks = [],
  onToggleBlock,
  onDeleteBlock,
  onEditBlock,
}: TodayPlanningProps) {
  return (
    <div>
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
              <span className="w-12 shrink-0 pt-4 font-mono text-black/70 text-xs text-muted-foreground">
                {block.time}
              </span>
              <span
                className={cn(
                  "relative z-10 mt-4 sm:mr-4 h-2 w-2 sm:h-3 sm:w-3 shrink-0 rounded-full",
                  moduleDotClass[block.module],
                )}
              />
              <div
                onClick={() => onEditBlock(block)}
                className="group relative flex-1 cursor-pointer rounded-2xl bg-white p-3 sm:p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBlock(block.id);
                      }}
                      className={cn(
                        "mt-0.5 flex h-3 w-3 sm:h-4 sm:w-4 shrink-0 items-center justify-center rounded-full border",
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
                          "text-xs sm:text-sm font-medium",
                          block.done && "text-muted-foreground line-through",
                        )}
                      >
                        {block.title}
                      </p>
                      <p className="text-[10px] sm:text-xs text-black/70 text-muted-foreground">
                        {block.duration ? `${block.duration} min` : ""} ·{" "}
                        {block.subtitle}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-medium uppercase tracking-wider",
                      moduleBadgeClass[block.module],
                    )}
                  >
                    {block.module}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteBlock(block.id);
                  }}
                  className="absolute bottom-3 right-3 text-black/30 opacity-0 transition-opacity hover:text-accent-danger group-hover:opacity-100"
                  aria-label="Supprimer ce bloc"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
