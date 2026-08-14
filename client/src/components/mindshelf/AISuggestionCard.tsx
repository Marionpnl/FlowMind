import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import NewActivityModal from "@/components/widgets/NewActivityModal";

const SUGGESTION_TEXT =
  "Tu lis Refactoring depuis 3 semaines — un chapitre par jour te mènerait à la fin d'ici le 24 juin.";

export default function AISuggestionCard() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);

  function handlePlan() {
    setSession((s) => s + 1);
    setOpen(true);
  }

  return (
    <div className="rounded-2xl bg-[#2B2A28] p-6 text-white">
      <p className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/80">
        <Sparkles className="h-3.5 w-3.5" />
        Suggestion IA
      </p>
      <p className="max-w-68 mb-5 font-display text-lg italic leading-snug">
        {SUGGESTION_TEXT}
      </p>
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          onClick={handlePlan}
          className="bg-mindshelf text-white rounded-xl hover:bg-mindshelf/90 cursor-pointer"
        >
          + Planifier dans FlowDay
        </Button>
        <button className="text-xs text-white/60 hover:text-white cursor-pointer">
          Plus tard
        </button>
      </div>

      <NewActivityModal
        key={session}
        open={open}
        onOpenChange={setOpen}
        defaultModule="MindShelf"
        defaultTitle="Lecture — Refactoring"
        defaultNotes={SUGGESTION_TEXT}
        defaultDuration={25}
      />
    </div>
  );
}
