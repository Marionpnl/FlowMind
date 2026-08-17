import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import NewActivityModal from "@/components/widgets/NewActivityModal";
import {
  useResourceStore,
  type ReadingPatternSuggestion,
} from "@/store/resourceStore";
import { useAuthStore } from "@/store/authStore";

export default function AISuggestionCard() {
  const fetchReadingPattern = useResourceStore((s) => s.fetchReadingPattern);
  const [suggestion, setSuggestion] = useState<ReadingPatternSuggestion | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const crossModuleSuggestions =
    useAuthStore((s) => s.user?.preferences?.crossModuleSuggestions) ?? true;

  useEffect(() => {
    if (!crossModuleSuggestions) return;
    fetchReadingPattern().then((result) => setSuggestion(result));
  }, [crossModuleSuggestions, fetchReadingPattern]);

  function handlePlan() {
    setSession((s) => s + 1);
    setOpen(true);
  }

  if (!crossModuleSuggestions) {
    return (
      <div className="rounded-2xl bg-[#2B2A28] p-6 text-white">
        <p className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/80">
          <Sparkles className="h-3.5 w-3.5" />
          Suggestion IA
        </p>
        <p className="text-sm text-white/60">
          Suggestions transversales désactivées dans tes paramètres.
        </p>
      </div>
    );
  }

  if (!suggestion) {
    return (
      <div className="rounded-2xl bg-[#2B2A28] p-6 text-white">
        <p className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/80">
          <Sparkles className="h-3.5 w-3.5" />
          Suggestion IA
        </p>
        <p className="text-sm text-white/60">
          Prends quelques notes cette semaine pour recevoir une suggestion de
          pratique liée à tes lectures.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#2B2A28] p-6 text-white">
      <p className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/80">
        <Sparkles className="h-3.5 w-3.5" />
        Suggestion IA
      </p>
      <p className="max-w-68 mb-5 font-display text-lg italic leading-snug">
        {suggestion.description}
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
        defaultModule="FlowDay"
        defaultTitle={suggestion.title}
        defaultNotes={suggestion.description}
        defaultDuration={suggestion.duration}
      />
    </div>
  );
}
