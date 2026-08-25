import { Clock } from "lucide-react";
import { formatDuration } from "@/lib/dateUtils";
import type { DayPlanBlock } from "@shared/types";

interface FocusCardProps {
  blocks: DayPlanBlock[];
}

export default function FocusCard({ blocks }: FocusCardProps) {
  // Même logique que le bilan hebdomadaire (computeWeeklyStats côté serveur) :
  // "FlowDay" = travail profond, "SparkTime" = pauses actives/mouvement —
  // juste calculée côté client puisqu'on n'a besoin que du jour déjà chargé.
  const deepWorkMinutes = blocks
    .filter((b) => b.module === "FlowDay")
    .reduce((sum, b) => sum + b.duration, 0);
  const activeBreaks = blocks.filter((b) => b.module === "SparkTime").length;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Clock className="mb-2 h-4.5 w-4.5 text-flowday" />
        <p className="mb-3 text-sm font-semibold text-muted-foreground">
          Focus aujourd'hui
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-cream-secondary p-3">
          <p className="text-xl font-mono font-semibold">
            {formatDuration(deepWorkMinutes)}
          </p>
          <p className="pt-1 text-xs text-muted-foreground">Travail profond</p>
        </div>
        <div className="rounded-xl bg-cream-secondary p-3">
          <p className="text-xl font-mono font-semibold">{activeBreaks}</p>
          <p className="pt-1 text-xs text-muted-foreground">Pauses actives</p>
        </div>
      </div>
    </div>
  );
}
