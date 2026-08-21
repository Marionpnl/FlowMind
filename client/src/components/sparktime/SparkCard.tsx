import { X } from "lucide-react";
import type { ISpark } from "@shared/types";
import { Button } from "@/components/ui/button";

interface SparkCardProps {
  spark: ISpark;
  onDetails: () => void;
  onPlan: () => void;
  onDelete: () => void;
}

export default function SparkCard({
  spark,
  onDetails,
  onPlan,
  onDelete,
}: SparkCardProps) {
  return (
    <div className="group relative rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full border border-black/10 bg-white text-black/40 shadow-sm hover:border-accent-danger/30 hover:text-accent-danger group-hover:flex"
        aria-label="Supprimer ce Spark"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="mb-3 flex items-center justify-between">
        {spark.category && (
          <span className="rounded-full bg-sparktime-bg px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-sparktime">
            {spark.category}
          </span>
        )}
        <span className="font-mono text-[10px] text-black/60 text-muted-foreground">
          {spark.duration} min
        </span>
      </div>

      <p className="text-md font-medium">{spark.title}</p>
      <p className="mt-1 text-xs text-black/50 text-muted-foreground">
        {spark.description}
      </p>
      {spark.detail && (
        <p className="mt-3 font-mono text-[11px] text-black/50 text-muted-foreground">
          {spark.detail}
        </p>
      )}

      <div className="mt-4 flex items-center gap-4">
        <Button
          size="sm"
          onClick={onPlan}
          className="bg-[#2B2A28] text-white font-normal text-xs rounded-2xl hover:bg-[#2B2A28]/90 cursor-pointer"
        >
          + Planifier
        </Button>
        <button
          onClick={onDetails}
          className="text-xs text-black/60 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          Détails →
        </button>
      </div>
    </div>
  );
}
