import { focusStats } from "@/lib/mockData";

export default function FocusCard() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Focus aujourd'hui
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-cream p-3">
          <p className="text-2xl font-semibold">
            {focusStats.deepWorkDuration}
          </p>
          <p className="text-xs text-muted-foreground">Travail profond</p>
        </div>
        <div className="rounded-xl bg-cream p-3">
          <p className="text-2xl font-semibold">{focusStats.activeBreaks}</p>
          <p className="text-xs text-muted-foreground">Pauses actives</p>
        </div>
      </div>
    </div>
  );
}
