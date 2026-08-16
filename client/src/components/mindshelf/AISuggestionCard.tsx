import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import NewActivityModal from "@/components/widgets/NewActivityModal";
import {
  useResourceStore,
  type RediscoverySuggestion,
} from "@/store/resourceStore";

export default function AISuggestionCard() {
  const resources = useResourceStore((s) => s.resources);
  const fetchRediscovery = useResourceStore((s) => s.fetchRediscovery);
  const [suggestion, setSuggestion] = useState<RediscoverySuggestion | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);

  useEffect(() => {
    fetchRediscovery().then((result) => setSuggestion(result));
  }, [fetchRediscovery]);

  function handlePlan() {
    setSession((s) => s + 1);
    setOpen(true);
  }

  const resource = suggestion
    ? resources.find((r) => r._id === suggestion.resourceId)
    : undefined;

  if (!suggestion || !resource) {
    return (
      <div className="rounded-2xl bg-[#2B2A28] p-6 text-white">
        <p className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/80">
          <Sparkles className="h-3.5 w-3.5" />
          Redécouverte IA
        </p>
        <p className="text-sm text-white/60">
          Ajoute quelques ressources pour recevoir une suggestion de
          redécouverte.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#2B2A28] p-6 text-white">
      <p className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/80">
        <Sparkles className="h-3.5 w-3.5" />
        Redécouverte IA
      </p>
      <p className="max-w-68 text-sm font-medium text-white/90">
        {resource.title}
      </p>
      <p className="max-w-68 mb-5 mt-1 font-display text-lg italic leading-snug">
        {suggestion.reason}
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
        defaultTitle={resource.title}
        defaultNotes={suggestion.reason}
        defaultDuration={25}
      />
    </div>
  );
}
