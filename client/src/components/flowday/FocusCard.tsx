import { focusStats } from "@/lib/mockData";
import { Clock } from "lucide-react";

export default function FocusCard() {
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
            {focusStats.deepWorkDuration}
          </p>
          <p className="pt-1 text-xs text-muted-foreground">Travail profond</p>
        </div>
        <div className="rounded-xl bg-cream-secondary p-3">
          <p className="text-xl font-mono font-semibold">
            {focusStats.activeBreaks}
          </p>
          <p className="pt-1 text-xs text-muted-foreground">Pauses actives</p>
        </div>
      </div>
    </div>
  );
}
