import { Button } from "@/components/ui/button";
import { WandSparkles } from "lucide-react";

export default function FlowDayPlanCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-flowday/20 bg-white p-6 shadow-sm">
      <span className="absolute inset-x-0 top-0 h-0.5 bg-flowday" />
      <span className={"h-2 w-2 shrink-0 rounded-full bg-flowday"} />
      <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-flowday">
        <span className="h-1.5 w-1.5 rounded-full bg-flowday" />
        FlowDay · Planification IA
      </p>
      <p className="font-display text-xl italic leading-snug">
        Énergie moyenne, deux heures pour coder ce matin, envie d'une sortie
        running ce soir.
      </p>
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
        >
          Générer le planning →
        </Button>
      </div>
    </div>
  );
}
