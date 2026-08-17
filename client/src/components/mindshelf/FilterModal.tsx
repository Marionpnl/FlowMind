import { Filter, RotateCcw, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CATEGORIES,
  LIBRARY_STATUSES,
  STATUS_LABELS,
  type SortOption,
} from "@/lib/resourceTypes";
import type { ResourceStatus } from "@shared/types";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "recent", label: "Récents" },
  { key: "title", label: "Titre A → Z" },
  { key: "rating", label: "Note" },
  { key: "progress", label: "Progression" },
];

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalCount: number;
  statuses: ResourceStatus[];
  onToggleStatus: (status: ResourceStatus) => void;
  categories: string[];
  onToggleCategory: (category: string) => void;
  minRating: number;
  onMinRatingChange: (rating: number) => void;
  sortBy: SortOption;
  onSortByChange: (sort: SortOption) => void;
  notesOnly: boolean;
  onNotesOnlyChange: (value: boolean) => void;
  onReset: () => void;
}

export default function FilterModal({
  open,
  onOpenChange,
  totalCount,
  statuses,
  onToggleStatus,
  categories,
  onToggleCategory,
  minRating,
  onMinRatingChange,
  sortBy,
  onSortByChange,
  notesOnly,
  onNotesOnlyChange,
  onReset,
}: FilterModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white p-6">
        <DialogHeader className="gap-1">
          <DialogTitle className="flex items-center gap-2 font-display text-2xl italic">
            <Filter className="h-5 w-5 text-mindshelf" />
            Filtrer la bibliothèque
          </DialogTitle>
          <DialogDescription className="text-xs text-black/70 text-muted-foreground">
            Affine l'affichage de tes {totalCount} livres
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 space-y-5">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-black/60 text-muted-foreground">
              Statut
            </p>
            <div className="flex flex-wrap gap-2">
              {LIBRARY_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => onToggleStatus(s)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                    statuses.includes(s)
                      ? "bg-[#2B2A28] text-white"
                      : "bg-cream-secondary border border-black/5 text-black/60 hover:border-black/30",
                  )}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-black/60 text-muted-foreground">
              Catégorie
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => onToggleCategory(c)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                    categories.includes(c)
                      ? "border-mindshelf/20 bg-mindshelf-bg text-mindshelf"
                      : "bg-cream-secondary border-black/5 text-black/60 hover:border-black/30",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-black/60 text-muted-foreground">
              Note minimale
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  onClick={() =>
                    onMinRatingChange(minRating === i + 1 ? 0 : i + 1)
                  }
                  className="cursor-pointer"
                  aria-label={`${i + 1} étoile${i > 0 ? "s" : ""} minimum`}
                >
                  <Star
                    className={cn(
                      "h-5 w-5",
                      i < minRating
                        ? "fill-mindshelf text-mindshelf"
                        : "text-black/15",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-black/60 text-muted-foreground">
              Trier par
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => onSortByChange(opt.key)}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer",
                    sortBy === opt.key
                      ? "border-mindshelf/20 bg-mindshelf-bg text-mindshelf"
                      : "bg-cream-secondary border-black/5 text-black/60 hover:border-black/30",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-black/70">
            <input
              type="checkbox"
              checked={notesOnly}
              onChange={(e) => onNotesOnlyChange(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-black/20 accent-mindshelf"
            />
            Uniquement les livres avec des notes
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-5">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-black/60 text-muted-foreground hover:underline cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            Réinitialiser
          </button>
          <Button
            size="lg"
            onClick={() => onOpenChange(false)}
            className="bg-mindshelf text-white rounded-2xl hover:bg-mindshelf/90"
          >
            Appliquer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
