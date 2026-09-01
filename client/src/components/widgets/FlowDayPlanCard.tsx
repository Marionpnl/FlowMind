import { useEffect, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { WandSparkles } from "lucide-react";
import { useDayPlanStore } from "@/store/dayPlanStore";
import { useAuthStore } from "@/store/authStore";

const DEFAULT_EXAMPLE =
  "Énergie moyenne, deux heures pour coder ce matin, envie d'une sortie running ce soir.";

interface FlowDayPlanCardProps {
  date: string;
}

// Libellé "aujourd'hui"/"demain" plutôt qu'une date brute, quand c'est
// pertinent — sinon la date formatée en français.
function labelForDate(target: string, referenceDate: string): string {
  if (target === referenceDate) return "aujourd'hui";
  const tomorrow = new Date(referenceDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (target === tomorrow.toISOString().slice(0, 10)) return "demain";
  return new Date(target).toLocaleDateString("fr-CH", {
    day: "numeric",
    month: "long",
  });
}

export default function FlowDayPlanCard({ date }: FlowDayPlanCardProps) {
  const [userInput, setUserInput] = useState(DEFAULT_EXAMPLE);
  const generatePlan = useDayPlanStore((s) => s.generatePlan);
  const generating = useDayPlanStore((s) => s.generating);
  const lastGenerationSummary = useDayPlanStore(
    (s) => s.lastGenerationSummary,
  );
  const autoGeneratePlan =
    useAuthStore((s) => s.user?.preferences?.autoGeneratePlan) ?? true;
  // N'affiche le résumé qu'après une génération déclenchée depuis CETTE
  // carte — `lastGenerationSummary` est un état global, il resterait sinon
  // affiché indéfiniment (ou réapparaîtrait) sans lien avec l'action en cours.
  const [showSummary, setShowSummary] = useState(false);

  // Simple bulle de confirmation qui se referme toute seule après quelques
  // secondes, plutôt qu'un message qui reste tant qu'on ne retape pas.
  useEffect(() => {
    if (!showSummary) return;
    const timer = setTimeout(() => setShowSummary(false), 4000);
    return () => clearTimeout(timer);
  }, [showSummary]);

  async function handleGenerate() {
    if (generating || !userInput.trim()) return;
    setShowSummary(false);
    await generatePlan(userInput, date);
    setShowSummary(true);
  }

  function handleFocus() {
    if (userInput === DEFAULT_EXAMPLE) setUserInput("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  }

  if (!autoGeneratePlan) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-flowday/20 bg-white p-6 shadow-sm">
        <span className="absolute inset-x-0 top-0 h-0.5 bg-flowday" />
        <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-flowday">
          <span className="h-1.5 w-1.5 rounded-full bg-flowday" />
          FlowDay · Planification IA
        </p>
        <p className="text-sm text-muted-foreground">
          Génération automatique désactivée dans tes paramètres.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-flowday/20 bg-white p-5 sm:p-6 shadow-sm">
      <span className="absolute inset-x-0 top-0 h-0.5 bg-flowday" />
      <span className={"h-2 w-2 shrink-0 rounded-full bg-flowday"} />
      <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-flowday">
        <span className="h-1.5 w-1.5 rounded-full bg-flowday" />
        FlowDay · Planification IA
      </p>

      <textarea
        aria-label="Décris ta journée"
        value={userInput}
        onChange={(e) => {
          setUserInput(e.target.value);
          setShowSummary(false);
        }}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        rows={2}
        className="w-full resize-none border-none bg-transparent font-display text-[18px] sm:text-lg italic leading-snug outline-none focus-visible:ring-2 focus-visible:ring-flowday/30 rounded placeholder:text-muted-foreground"
        placeholder="Décris ta journée... Énergie moyenne, deux heures pour coder ce matin, envie d'une sortie
        running ce soir."
      />

      <div className="mt-4 flex items-center justify-between gap-6">
        <div className=" flex items-center justify-start gap-2">
          <WandSparkles className="h-3.5 w-3.5 text-black/70" />
          <p className="text-[10px] sm:text-xs text-black/70 text-muted-foreground">
            L'IA structurera des blocs équilibrés
          </p>
        </div>
        <Button
          size="sm"
          className="h-6 px-2 text-[10px] sm:h-7 sm:px-2.5 sm:text-[0.8rem] bg-flowday text-white hover:bg-flowday/90 rounded-xl"
          onClick={handleGenerate}
          disabled={generating || !userInput.trim()}
        >
          {generating ? "Génération..." : "Générer le planning →"}
        </Button>
      </div>

      {showSummary && lastGenerationSummary && lastGenerationSummary.length > 0 && (
        <p className="mt-3 text-xs text-flowday">
          {lastGenerationSummary
            .map(
              (s) =>
                `${s.count} bloc${s.count > 1 ? "s" : ""} ajouté${s.count > 1 ? "s" : ""} ${labelForDate(s.date, date)}`,
            )
            .join(" · ")}
        </p>
      )}
    </div>
  );
}
