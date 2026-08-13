import { useState } from "react";
import { Compass, Plus, Sparkles, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useInterestStore } from "@/store/interestStore";
import { CATEGORIES } from "@/lib/sparktime";
import { cn } from "@/lib/utils";

const sliderColorClass = cn(
  "[&_[data-slot=slider-track]]:bg-black/10",
  "[&_[data-slot=slider-range]]:bg-sparktime",
  "[&_[data-slot=slider-thumb]]:border-sparktime",
);

interface InterestsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InterestsModal({
  open,
  onOpenChange,
}: InterestsModalProps) {
  const interests = useInterestStore((s) => s.interests);
  const addInterest = useInterestStore((s) => s.addInterest);
  const deleteInterest = useInterestStore((s) => s.deleteInterest);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [importance, setImportance] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await addInterest({
        name: name.trim(),
        category: category ?? undefined,
        importance,
      });
      setName("");
      setCategory(null);
      setImportance(3);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-cream p-0 max-h-[90vh] flex flex-col">
        <div className="shrink-0 p-6 pb-4">
          <DialogHeader className="gap-1">
            <DialogTitle className="flex items-center gap-2 font-display text-2xl italic">
              <Compass className="h-5 w-5 text-sparktime" />
              Centres d'intérêt
            </DialogTitle>
            <p className="text-sm text-black/60 text-muted-foreground">
              Ces thèmes guident les suggestions générées pour toi.
            </p>
          </DialogHeader>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 pb-6">
          <div className="rounded-2xl border border-black/5 bg-cream-secondary p-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-black/60 text-muted-foreground">
              Ajouter un intérêt
            </p>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. escalade en salle"
              className="h-10 rounded-xl border-black/10 bg-white"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(category === c ? null : c)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    category === c
                      ? "border-sparktime/50 bg-sparktime-bg text-sparktime"
                      : "bg-white border-black/10 text-black/60 hover:border-black/30",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="mt-5">
              <div className="mb-2.5 flex items-center justify-between text-xs text-black/70 text-muted-foreground">
                <span className="uppercase tracking-widest">Importance</span>
                <span className="font-mono">{importance}/5</span>
              </div>
              <Slider
                className={sliderColorClass}
                value={[importance]}
                min={1}
                max={5}
                step={1}
                onValueChange={(v) =>
                  setImportance(Array.isArray(v) ? v[0] : v)
                }
              />
            </div>

            <Button
              size="sm"
              disabled={submitting || !name.trim()}
              onClick={handleAdd}
              className="mt-4 bg-sparktime text-white rounded-xl hover:bg-sparktime/90"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Ajouter
            </Button>
          </div>

          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-widest text-black/60 text-muted-foreground">
                Tes intérêts
              </p>
              <span className="font-mono text-xs text-black/60 text-muted-foreground">
                {interests.length}
              </span>
            </div>

            {interests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun centre d'intérêt pour l'instant.
              </p>
            ) : (
              <div className="space-y-2">
                {interests.map((i) => (
                  <div
                    key={i._id}
                    className="flex items-center justify-between rounded-3xl border border-black/5 bg-cream-secondary py-3.5 px-5"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {i.emoji} {i.name}
                      </p>
                      {i.category && (
                        <p className="mt-1 font-mono text-xs text-black/60 text-muted-foreground">
                          {i.category}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, idx) => (
                          <span
                            key={idx}
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              idx < i.importance
                                ? "bg-sparktime"
                                : "bg-black/15",
                            )}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => deleteInterest(i._id)}
                        className="text-black/30 hover:text-accent-danger"
                        aria-label="Supprimer ce centre d'intérêt"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="flex items-center gap-1.5 text-xs text-black/60 text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-sparktime" />
            Plus l'importance est haute, SparkTime te proposera d'activités
            liées à ce thème.
          </p>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => onOpenChange(false)}
              className="bg-[#2B2A28] text-white rounded-xl hover:bg-[#2B2A28]/90"
            >
              Terminé
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
