import type { ISpark } from "@shared/types";
import { Sparkles } from "lucide-react";
import { getCategoryIcon } from "@/lib/sparktime";
import { cn } from "@/lib/utils";

interface CategoriesPanelProps {
  sparks: ISpark[];
  activeCategory?: string | null;
  onSelectCategory?: (category: string) => void;
}

export default function CategoriesPanel({
  sparks,
  activeCategory,
  onSelectCategory,
}: CategoriesPanelProps) {
  const counts = new Map<string, number>();
  for (const s of sparks) {
    const category = s.category || "Autre";
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  const categories = Array.from(counts.entries());

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wide">
        <Sparkles className="h-4.5 w-4.5 text-sparktime" />
        Catégories
      </h2>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune suggestion pour l'instant.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {categories.map(([category, count]) => {
            const Icon = getCategoryIcon(category);
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => onSelectCategory?.(category)}
                className={cn(
                  "rounded-xl p-3 text-left transition-colors cursor-pointer",
                  isActive
                    ? "bg-sparktime-bg ring-1 ring-sparktime/40"
                    : "bg-cream-secondary hover:bg-black/5",
                )}
              >
                <div
                  className={cn(
                    "mb-2 flex h-8 w-8 items-center justify-center rounded-lg",
                    isActive ? "bg-cream" : "bg-sparktime-bg",
                  )}
                >
                  <Icon className="h-4 w-4 text-sparktime" />
                </div>
                <p className="text-sm font-medium">{category}</p>
                <p className="font-mono text-[10px] text-black/50 text-muted-foreground">
                  {count} idée{count > 1 ? "s" : ""}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
