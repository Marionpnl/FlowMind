import { Check } from "lucide-react";
import { todayBlocks } from "@/lib/mockData";
import { moduleBadgeClass, moduleDotClass } from "@/lib/moduleStyles";
import { cn } from "@/lib/utils";

export default function TodayPlanning() {
  return (
    <div>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl italic">Aujourd'hui</h2>
          <p className="text-xs text-muted-foreground">
            {todayBlocks.length} blocs · 4h15 de travail focus
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button className="rounded-full bg-[#2B2A28] px-3 py-1 text-xs font-medium text-white">
            Jour
          </button>
          <button className="px-3 py-1 text-xs text-black/70 text-muted-foreground hover:text-foreground">
            Semaine
          </button>
          <button className="px-3 py-1 text-xs text-black/70 text-muted-foreground hover:text-foreground">
            Mois
          </button>
        </div>
      </div>

      <ul className="relative space-y-3">
        <div className="absolute left-[47px] top-2 bottom-2 w-px bg-black/10" />

        {todayBlocks.map((block) => (
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
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                      block.done
                        ? "border-flowday bg-flowday text-white"
                        : "border-black/20 text-transparent",
                    )}
                  >
                    <Check className="h-3 w-3 cursor-pointer" />
                  </span>
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
    </div>
  );
}
