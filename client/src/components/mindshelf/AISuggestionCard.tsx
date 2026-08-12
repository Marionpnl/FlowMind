import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AISuggestionCard() {
  return (
    <div className="rounded-2xl bg-[#2B2A28] p-6 text-white">
      <p className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/80">
        <Sparkles className="h-3.5 w-3.5" />
        Suggestion IA
      </p>
      <p className="max-w-68 mb-5 font-display text-lg italic leading-snug">
        Tu lis Refactoring depuis 3 semaines — un chapitre par jour te mènerait
        à la fin d'ici le 24 juin.
      </p>
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          className="bg-mindshelf text-white rounded-xl hover:bg-mindshelf/90"
        >
          + Planifier dans FlowDay
        </Button>
        <button className="text-xs text-white/60 hover:text-white">
          Plus tard
        </button>
      </div>
    </div>
  );
}
