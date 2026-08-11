import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WandSparkles } from "lucide-react";
import { useDayPlanStore } from "@/store/dayPlanStore";

interface FlowDayPlanCardProps {
  date: string;
}

export default function FlowDayPlanCard({ date }: FlowDayPlanCardProps) {
  const [userInput, setUserInput] = useState(
    "Énergie moyenne, deux heures pour coder ce matin, envie d'une sortie running ce soir.",
  );
  const generatePlan = useDayPlanStore((s) => s.generatePlan);
  const generating = useDayPlanStore((s) => s.generating);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-flowday/20 bg-white p-6 shadow-sm">
      <span className="absolute inset-x-0 top-0 h-0.5 bg-flowday" />
      <span className={"h-2 w-2 shrink-0 rounded-full bg-flowday"} />
      <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-flowday">
        <span className="h-1.5 w-1.5 rounded-full bg-flowday" />
        FlowDay · Planification IA
      </p>

      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        rows={2}
        className="w-full resize-none border-none bg-transparent font-display text-lg italic leading-snug outline-none placeholder:text-muted-foreground"
        placeholder="Décris ta journée... Énergie moyenne, deux heures pour coder ce matin, envie d'une sortie
        running ce soir."
      />

      <div className="mt-4 flex items-center justify-between">
        <div className=" flex items-center justify-start gap-2">
          <WandSparkles className="h-3.5 w-3.5 text-black/70" />
          <p className="text-xs text-black/70 text-muted-foreground">
            L'IA structurera des blocs équilibrés
          </p>
        </div>
        <Button
          size="sm"
          className="bg-flowday text-white hover:bg-flowday/90 rounded-xl"
          onClick={() => generatePlan(userInput, date)}
          disabled={generating || !userInput.trim()}
        >
          {generating ? "Génération..." : "Générer le planning →"}
        </Button>
      </div>
    </div>
  );
}
