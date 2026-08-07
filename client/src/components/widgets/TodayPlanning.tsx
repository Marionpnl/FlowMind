import { todayBlocks } from "@/lib/mockData";
import { moduleBadgeClass, moduleDotClass } from "@/lib/moduleStyles";

export default function TodayPlanning() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-xl italic">Aujourd'hui</h2>
        <p className="text-xs text-muted-foreground">
          {todayBlocks.length} blocs · 4h15 de travail focus
        </p>
      </div>

      <ul className="space-y-3">
        {todayBlocks.map((block) => (
          <li key={block.id} className="flex items-center gap-3">
            <span className="w-12 shrink-0 text-xs text-muted-foreground">
              {block.time}
            </span>
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${moduleDotClass[block.module]}`}
            />
            <div className="flex-1">
              <p className="text-sm font-medium">{block.title}</p>
              <p className="text-xs text-muted-foreground">{block.subtitle}</p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${moduleBadgeClass[block.module]}`}
            >
              {block.module}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
