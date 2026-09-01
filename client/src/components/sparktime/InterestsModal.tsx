import { useEffect, useRef, useState } from "react";
import { Compass, Pencil, Plus, Sparkles, Wand2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useInterestStore, type DetectedInterest } from "@/store/interestStore";
import { CATEGORIES } from "@/lib/sparktime";
import { cn } from "@/lib/utils";
import { useLongPress } from "@/hooks/useLongPress";
import type { IInterest } from "@shared/types";

const sliderColorClass = cn(
  "[&_[data-slot=slider-track]]:bg-black/10",
  "[&_[data-slot=slider-range]]:bg-sparktime",
  "[&_[data-slot=slider-thumb]]:border-sparktime",
);

type Tab = "add" | "mine";

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
  const detectInterests = useInterestStore((s) => s.detectInterests);

  const [tab, setTab] = useState<Tab>("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [importance, setImportance] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<DetectedInterest[] | null>(
    null,
  );
  const [detecting, setDetecting] = useState(false);
  const [addingSuggestion, setAddingSuggestion] = useState<string | null>(null);

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
        <div className="shrink-0 px-6">
          <DialogHeader className="gap-1 pt-4">
            <DialogTitle className="flex items-center gap-2 font-display text-2xl italic">
              <Compass className="h-5 w-5 text-sparktime" />
              Centres d'intérêt
            </DialogTitle>
            <p className="text-sm text-black/60 text-muted-foreground">
              Ces thèmes guident les suggestions générées pour toi.
            </p>
          </DialogHeader>

          <div className="mt-4 flex gap-1 rounded-xl bg-cream-secondary p-1">
            <button
              onClick={() => setTab("add")}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer",
                tab === "add"
                  ? "bg-white shadow-sm"
                  : "text-black/60 hover:text-foreground",
              )}
            >
              Ajouter un intérêt
            </button>
            <button
              onClick={() => setTab("mine")}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer",
                tab === "mine"
                  ? "bg-white shadow-sm"
                  : "text-black/60 hover:text-foreground",
              )}
            >
              Mes intérêts {interests.length}
            </button>
          </div>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 pb-6">
          {tab === "add" ? (
            <>
              <div>
                <Input
                  aria-label="Nom du centre d'intérêt"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex. escalade en salle"
                  className="h-10 rounded-xl border-black/10 bg-cream-secondary"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                  }}
                />

                <p
                  id="interest-category-label"
                  className="mt-4 mb-2 text-xs font-medium uppercase tracking-widest text-black/60 text-muted-foreground"
                >
                  Catégorie
                </p>
                <div
                  role="group"
                  aria-labelledby="interest-category-label"
                  className="flex flex-wrap gap-2"
                >
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
                    <span className="uppercase tracking-widest">
                      Importance
                    </span>
                    <span className="font-mono">{importance}/5</span>
                  </div>
                  <Slider
                    aria-label="Importance"
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
                    {detecting
                      ? "Analyse..."
                      : "Suggérer des centres d'intérêt"}
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
                          className="flex items-center justify-between rounded-xl border border-sparktime/20 bg-sparktime-bg px-4 py-2"
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
            </>
          ) : interests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun centre d'intérêt pour l'instant.
            </p>
          ) : (
            <div className="space-y-2">
              {interests.map((i) => (
                <InterestRow
                  key={i._id}
                  interest={i}
                  editing={editingId === i._id}
                  onStartEdit={() => setEditingId(i._id)}
                  onStopEdit={() => setEditingId(null)}
                />
              ))}
            </div>
          )}

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

function InterestRow({
  interest,
  editing,
  onStartEdit,
  onStopEdit,
}: {
  interest: IInterest;
  editing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
}) {
  const updateInterest = useInterestStore((s) => s.updateInterest);
  const deleteInterest = useInterestStore((s) => s.deleteInterest);
  const rowRef = useRef<HTMLDivElement>(null);
  const [setLongPressRef, longPressRevealed, longPressTouchHandlers] = useLongPress<HTMLDivElement>();
  const [draftName, setDraftName] = useState(interest.name);
  const draftNameRef = useRef(draftName);
  useEffect(() => {
    draftNameRef.current = draftName;
  });

  // Réinitialise le brouillon à l'ouverture de l'édition — différé en
  // microtâche pour ne pas déclencher de setState synchrone en tout début
  // d'effet (cf. le même pattern pour handleDetect plus haut dans ce fichier).
  useEffect(() => {
    if (!editing) return;
    void Promise.resolve().then(() => setDraftName(interest.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  function commitAndClose() {
    const trimmed = draftNameRef.current.trim();
    if (trimmed && trimmed !== interest.name) {
      updateInterest(interest._id, { name: trimmed });
    }
    onStopEdit();
  }

  // Un clic hors de la ligne valide et referme l'édition — `commitAndClose`
  // lit toujours `draftNameRef.current` (jamais périmé), donc peu importe
  // que ce handler garde la version de la fonction créée à l'ouverture de
  // l'édition (l'effet ne se redéclenche pas à chaque frappe).
  useEffect(() => {
    if (!editing) return;
    function handleClickOutside(e: MouseEvent) {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) {
        commitAndClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  return (
    <div
      ref={(node) => {
        rowRef.current = node;
        setLongPressRef(node);
      }}
      {...longPressTouchHandlers}
      className="group relative flex items-center justify-between rounded-3xl border border-black/5 bg-cream-secondary py-2.5 px-5 hover:z-10"
    >
      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            aria-label="Renommer le centre d'intérêt"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitAndClose();
              }
            }}
            className="w-full bg-transparent text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-black/15 rounded"
          />
        ) : (
          <p className="truncate text-sm font-medium">
            {interest.emoji} {interest.name}
          </p>
        )}

        {editing ? (
          <select
            aria-label="Catégorie du centre d'intérêt"
            value={interest.category ?? ""}
            onChange={(e) =>
              updateInterest(interest._id, {
                category: e.target.value || undefined,
              })
            }
            className="mt-1 bg-transparent font-mono text-xs text-black/60 outline-none focus-visible:ring-2 focus-visible:ring-black/15 rounded"
          >
            <option value="">—</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        ) : (
          interest.category && (
            <p className="mt-1 truncate font-mono text-xs text-black/60 text-muted-foreground">
              {interest.category}
            </p>
          )
        )}
      </div>

      <div className="flex shrink-0 items-center gap-5">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }, (_, idx) =>
            editing ? (
              // -m-1.5 compense le p-1.5 : la zone cliquable réelle est bien
              // plus grande que le point visuel (6x6px, imprécis à la souris),
              // sans que ça ne change l'espacement visible entre les points.
              <button
                key={idx}
                type="button"
                onClick={() =>
                  updateInterest(interest._id, { importance: idx + 1 })
                }
                aria-label={`Importance ${idx + 1}`}
                className="-m-1.5 cursor-pointer p-1.5"
              >
                <span
                  className={cn(
                    "block h-1.5 w-1.5 rounded-full transition-opacity hover:opacity-70",
                    idx < interest.importance ? "bg-sparktime" : "bg-black/15",
                  )}
                />
              </button>
            ) : (
              <span
                key={idx}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  idx < interest.importance ? "bg-sparktime" : "bg-black/15",
                )}
              />
            ),
          )}
        </div>

        {!editing && (
          <button
            onClick={onStartEdit}
            className="text-black/30 hover:text-sparktime"
            aria-label="Modifier ce centre d'intérêt"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteInterest(interest._id);
        }}
        className={cn(
          "absolute -right-2 -top-2 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-black/10 bg-white text-black/40 shadow-sm hover:border-accent-danger/30 hover:text-accent-danger group-hover:flex",
          longPressRevealed && "flex",
        )}
        aria-label="Supprimer ce centre d'intérêt"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
