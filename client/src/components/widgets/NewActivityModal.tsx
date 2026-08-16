import { useState } from "react";
import { Leaf, BookOpen, Sparkles, Wand2, type LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDayPlanStore } from "@/store/dayPlanStore";
import type { DayPlanBlock, HabitModule } from "@shared/types";
import {
  moduleSelectedClass,
  moduleTextClass,
  moduleButtonClass,
} from "@/lib/moduleStyles";
import { cn } from "@/lib/utils";

const MODULES: {
  key: HabitModule;
  label: string;
  subtitle: string;
  Icon: LucideIcon;
}[] = [
  {
    key: "FlowDay",
    label: "FlowDay",
    subtitle: "Travail, focus, rendez-vous",
    Icon: Leaf,
  },
  {
    key: "MindShelf",
    label: "MindShelf",
    subtitle: "Lecture, notes",
    Icon: BookOpen,
  },
  {
    key: "SparkTime",
    label: "SparkTime",
    subtitle: "Inspiration, sortie",
    Icon: Sparkles,
  },
];

export type ActivityModalTarget =
  | { mode: "create" }
  | { mode: "edit"; block: DayPlanBlock; date: string };

interface NewActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultModule?: HabitModule;
  defaultTitle?: string;
  defaultNotes?: string;
  defaultDuration?: number;
  defaultDate?: string;
  defaultTime?: string;
  sparkId?: string;
  editingBlockId?: string;
}

export default function NewActivityModal({
  open,
  onOpenChange,
  defaultModule = "FlowDay",
  defaultTitle = "",
  defaultNotes = "",
  defaultDuration,
  defaultDate,
  defaultTime,
  sparkId,
  editingBlockId,
}: NewActivityModalProps) {
  const scheduleActivity = useDayPlanStore((s) => s.scheduleActivity);
  const updateBlock = useDayPlanStore((s) => s.updateBlock);
  const isEditing = !!editingBlockId;

  // Initialisé une seule fois au montage : le parent force un remount (via `key`)
  // à chaque nouvelle ouverture pour repartir d'un formulaire vierge/pré-rempli.
  const [form, setForm] = useState({
    module: defaultModule,
    title: defaultTitle,
    date: defaultDate ?? new Date().toISOString().split("T")[0],
    time: defaultTime ?? "09:00",
    duration: defaultDuration ?? 30,
    notes: defaultNotes,
  });
  const [submitting, setSubmitting] = useState(false);

  const { module, title, date, time, duration, notes } = form;

  async function handleSubmit() {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      if (isEditing) {
        await updateBlock(editingBlockId, {
          title: title.trim(),
          subtitle: notes.trim() || undefined,
          duration,
          date,
          time,
          module,
        });
        onOpenChange(false);
      } else {
        const result = await scheduleActivity({
          title: title.trim(),
          notes: notes.trim() || undefined,
          duration: duration || undefined,
          date: date || undefined,
          time: time || undefined,
          module,
          sparkId,
        });
        if (result) onOpenChange(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-cream p-6 max-h-[85vh] flex flex-col overflow-y-auto">
        <DialogHeader className="gap-1">
          <DialogTitle className="font-display text-2xl italic">
            {isEditing ? "Modifier l'activité" : "Nouvelle activité"}
          </DialogTitle>
          <p className="text-sm text-black/60 text-muted-foreground">
            {isEditing
              ? "Ajuste le créneau, la durée ou le module de cette activité."
              : "Décris ce que tu veux faire — l'IA proposera un créneau."}
          </p>
        </DialogHeader>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {MODULES.map(({ key, label, subtitle, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setForm((f) => ({ ...f, module: key }))}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                module === key
                  ? moduleSelectedClass[key]
                  : "border-black/10 bg-white hover:border-black/20",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  module === key ? moduleTextClass[key] : "text-black/40",
                )}
              />
              <p className="mt-1.5 text-xs font-medium">{label}</p>
              <p className="text-[10px] text-black/50 text-muted-foreground">
                {subtitle}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-1">
          <label className="text-xs font-medium uppercase tracking-widest text-black/50 text-muted-foreground">
            Titre
          </label>
          <Input
            value={title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ex. Deep work - Refactor auth"
            className="mt-1.5 h-10 rounded-xl border-black/10 bg-cream-secondary"
          />
        </div>

        <div className="mt-1 grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-black/50 text-muted-foreground">
              Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="mt-1.5 h-10 rounded-xl border-black/10 bg-cream-secondary font-mono text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-black/50 text-muted-foreground">
              Heure
            </label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              className="mt-1.5 h-10 rounded-xl border-black/10 bg-cream-secondary font-mono text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-black/50 text-muted-foreground">
              Durée (min)
            </label>
            <Input
              type="number"
              min={5}
              step={5}
              value={duration}
              onChange={(e) =>
                setForm((f) => ({ ...f, duration: Number(e.target.value) }))
              }
              className="mt-1.5 h-10 rounded-xl border-black/10 bg-cream-secondary font-mono text-xs"
            />
          </div>
        </div>

        <div className="mt-1">
          <label className="text-xs font-medium uppercase tracking-widest text-black/50 text-muted-foreground">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Contexte, intention, énergie..."
            rows={2}
            className="mt-1.5 w-full resize-none rounded-xl border border-black/10 bg-cream-secondary px-2.5 py-2 text-sm outline-none"
          />
        </div>

        {!isEditing && (
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-cream-secondary px-3 py-2.5 text-xs text-black/60 text-muted-foreground">
            <Wand2 className="h-3.5 w-3.5 shrink-0 text-sparktime" />
            L'IA suggérera un horaire optimal si tu laisses la date ou
            l'heure vide.
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="text-xs text-black/60 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Annuler
          </button>
          <Button
            size="sm"
            disabled={submitting || !title.trim()}
            onClick={handleSubmit}
            className={cn("text-white rounded-xl", moduleButtonClass[module])}
          >
            {isEditing ? "Enregistrer" : "+ Ajouter"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
