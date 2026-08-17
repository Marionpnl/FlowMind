import { Check } from "lucide-react";
import { moduleBadgeClass } from "@/lib/moduleStyles";
import { cn } from "@/lib/utils";

const MODULES: {
  name: "FlowDay" | "MindShelf" | "SparkTime";
  sub: string;
}[] = [
  { name: "FlowDay", sub: "Planification" },
  { name: "MindShelf", sub: "Bibliothèque" },
  { name: "SparkTime", sub: "Inspirations" },
];

export default function ModulesSection() {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold tracking-wide">
        Modules actifs
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {MODULES.map((m) => (
          <div
            key={m.name}
            className={cn("rounded-xl p-4", moduleBadgeClass[m.name])}
          >
            <div className="mb-3 flex items-center justify-between text-[10px] font-medium uppercase tracking-widest">
              Actif
              <Check className="h-3.5 w-3.5" />
            </div>
            <p className="text-sm text-black font-medium text-foreground">
              {m.name}
            </p>
            <p className="text-xs text-black/60 text-muted-foreground">
              {m.sub}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
