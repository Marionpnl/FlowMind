import { Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FlowDayPlanCard() {
  return (
    <div className="rounded-2xl border border-flowday/20 bg-white p-5 shadow-sm">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-flowday">
        <Circle className="h-3.5 w-3.5" />
        FlowDay · Planification IA
      </p>
      <p className="font-display text-lg italic leading-snug">
        Énergie moyenne, deux heures pour coder ce matin, envie d'une sortie
        running ce soir.
      </p>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          L'IA structurera des blocs équilibrés
        </p>
        <Button size="sm" className="bg-flowday text-white hover:bg-flowday/90">
          Générer le planning →
        </Button>
      </div>
    </div>
  );
}
