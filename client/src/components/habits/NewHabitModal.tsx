import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import EmojiPicker from "./EmojiPicker";
import { useHabitStore } from "@/store/habitStore";
import type { HabitModule } from "@shared/types";
import { cn } from "@/lib/utils";

const MODULES: { key: HabitModule; label: string; activeClass: string }[] = [
  {
    key: "FlowDay",
    label: "FlowDay",
    activeClass: "bg-flowday text-white border-flowday",
  },
  {
    key: "MindShelf",
    label: "MindShelf",
    activeClass: "bg-mindshelf text-white border-mindshelf",
  },
  {
    key: "SparkTime",
    label: "SparkTime",
    activeClass: "bg-sparktime text-white border-sparktime",
  },
];

interface NewHabitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewHabitModal({
  open,
  onOpenChange,
}: NewHabitModalProps) {
  const addHabit = useHabitStore((s) => s.addHabit);

  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [module, setModule] = useState<HabitModule>("FlowDay");
  const [emoji, setEmoji] = useState("⚡");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await addHabit({
        name: name.trim(),
        emoji,
        goal: goal.trim() || undefined,
        module,
      });
      resetForm();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setName("");
    setGoal("");
    setModule("FlowDay");
    setEmoji("⚡");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-cream border border-black/15">
        <DialogHeader>
          <DialogTitle className="mt-3 font-display text-xl italic">
            Nouvelle habitude
          </DialogTitle>
          <DialogDescription className="text-xs text-black/70 text-muted-foreground">
            Choisis un rythme réaliste — l'IA l'intégrera à tes journées.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="text-xs text-black/70 font-medium uppercase tracking-widest text-muted-foreground">
              Nom
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Méditation"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs text-black/70 font-medium uppercase tracking-widest text-muted-foreground">
              Objectif
            </label>
            <Input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="10 min chaque matin"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs text-black/70 font-medium uppercase tracking-widest text-muted-foreground">
              Module
            </label>
            <div className="mt-1 flex gap-2">
              {MODULES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setModule(m.key)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
                    module === m.key
                      ? m.activeClass
                      : "border-black/15 text-muted-foreground hover:border-black/30",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-black/70 font-medium uppercase tracking-widest text-muted-foreground">
              Emoji
            </label>
            <div className="mt-1">
              <EmojiPicker value={emoji} onChange={setEmoji} />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-black/70"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !name.trim()}
            className="bg-flowday text-white text-xs hover:bg-flowday/90"
          >
            {submitting ? "Ajout..." : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
