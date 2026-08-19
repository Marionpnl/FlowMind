import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { WandSparkles } from "lucide-react";
import { useDayPlanStore } from "@/store/dayPlanStore";
import { useAuthStore } from "@/store/authStore";

const DEFAULT_EXAMPLE =
  "Énergie moyenne, deux heures pour coder ce matin, envie d'une sortie running ce soir.";

interface FlowDayPlanCardProps {
  date: string;
}

export default function FlowDayPlanCard({ date }: FlowDayPlanCardProps) {
  const [userInput, setUserInput] = useState(DEFAULT_EXAMPLE);
  const generatePlan = useDayPlanStore((s) => s.generatePlan);
  const generating = useDayPlanStore((s) => s.generating);
  const autoGeneratePlan =
    useAuthStore((s) => s.user?.preferences?.autoGeneratePlan) ?? true;

  function handleGenerate() {
    if (generating || !userInput.trim()) return;
    generatePlan(userInput, date);
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
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        rows={2}
        className="w-full resize-none border-none bg-transparent font-display text-[18px] sm:text-lg italic leading-snug outline-none placeholder:text-muted-foreground"
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
    </div>
  );
}
