import { useEffect, useState } from "react";
import { Compass, Plus, Sparkles, Wand2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  useInterestStore,
  type DetectedInterest,
} from "@/store/interestStore";
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
  const detectInterests = useInterestStore((s) => s.detectInterests);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [importance, setImportance] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<DetectedInterest[] | null>(
    null,
  );
  const [detecting, setDetecting] = useState(false);
  const [addingSuggestion, setAddingSuggestion] = useState<string | null>(
    null,
  );

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

  async function handleDetect() {
    setDetecting(true);
    try {
      const result = await detectInterests();
      setSuggestions(result);
    } finally {
      setDetecting(false);
    }
  }

  // Un premier jet de suggestions apparaît dès l'ouverture ; le bouton reste
  // disponible pour en redemander d'autres ensuite. Déférée en microtâche
  // pour ne pas déclencher de setState synchrone dans l'effet lui-même.
  useEffect(() => {
    if (!open) return;
    void Promise.resolve().then(() => handleDetect());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function acceptSuggestion(suggestion: DetectedInterest) {
    setAddingSuggestion(suggestion.name);
    try {
      await addInterest({
        name: suggestion.name,
        emoji: suggestion.emoji,
        category: suggestion.category,
        source: "ai",
      });
      setSuggestions(
        (prev) => prev?.filter((s) => s.name !== suggestion.name) ?? null,
      );
    } finally {
      setAddingSuggestion(null);
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
                Suggestions IA
              </p>
              <button
                onClick={handleDetect}
                disabled={detecting}
                className="flex items-center gap-1.5 text-xs text-sparktime hover:underline disabled:opacity-50 cursor-pointer"
              >
                <Wand2 className="h-3.5 w-3.5" />
                {detecting ? "Analyse..." : "Suggérer des centres d'intérêt"}
              </button>
            </div>

            {suggestions !== null &&
              (suggestions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune suggestion pour l'instant — ajoute des habitudes ou
                  des ressources dans FlowDay/MindShelf pour que l'IA en
                  déduise des idées.
                </p>
              ) : (
                <div className="space-y-2">
                  {suggestions.map((s) => (
                    <div
                      key={s.name}
                      className="flex items-center justify-between rounded-xl border border-sparktime/20 bg-sparktime-bg px-4 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {s.emoji} {s.name}
                        </p>
                        {s.category && (
                          <p className="font-mono text-xs text-black/60 text-muted-foreground">
                            {s.category}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => acceptSuggestion(s)}
                        disabled={addingSuggestion === s.name}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sparktime hover:bg-white/70 disabled:opacity-50 cursor-pointer"
                        aria-label={`Ajouter ${s.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ))}
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
