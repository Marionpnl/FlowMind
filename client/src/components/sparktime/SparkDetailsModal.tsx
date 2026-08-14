import {
  Clock,
  Zap,
  MapPin,
  Sparkles,
  Share2,
  CalendarPlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ISpark } from "@shared/types";

interface SparkDetailsModalProps {
  spark: ISpark | null;
  onOpenChange: (open: boolean) => void;
  onPlan: (spark: ISpark) => void;
}

export default function SparkDetailsModal({
  spark,
  onOpenChange,
  onPlan,
}: SparkDetailsModalProps) {
  if (!spark) return null;

  const currentSpark = spark;
  const reason = currentSpark.category
    ? `Une pause ${currentSpark.category.toLowerCase()} de ${currentSpark.duration} min pourrait bien s'intégrer à ton moment actuel.`
    : `Une activité de ${currentSpark.duration} min pourrait bien s'intégrer à ton moment actuel.`;

  return (
    <Dialog open={!!spark} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl overflow-hidden bg-cream p-0 max-h-[85vh] flex flex-col">
        <div className="shrink-0 bg-sparktime-bg p-6 pb-4">
          <DialogHeader className="gap-1">
            <div className="flex items-center justify-between pr-6">
              {currentSpark.category && (
                <span className="w-fit rounded-full bg-sparktime px-2.5 py-1 text-[10px] text-white font-medium uppercase tracking-widest">
                  {currentSpark.category}
                </span>
              )}
              <span className="font-mono text-[10px] text-sparktime">
                {currentSpark.duration} min
              </span>
            </div>
            <DialogTitle className="mt-2 font-display text-2xl italic">
              {currentSpark.title}
            </DialogTitle>
            <p className="mt-1 text-sm text-black/60 text-muted-foreground">
              {currentSpark.description}
            </p>
          </DialogHeader>
        </div>

        <div className="space-y-4 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-cream-secondary p-3">
              <Clock className="h-3.5 w-3.5 text-sparktime" />
              <p className="mt-1.5 text-black/60 text-[10px] uppercase tracking-widest text-muted-foreground">
                Durée
              </p>
              <p className="mt-1.5 font-mono text-black/70 text-xs font-medium">
                {currentSpark.duration} min
              </p>
            </div>
            <div className="rounded-xl border border-border bg-cream-secondary p-3">
              <Zap className="h-3.5 w-3.5 text-sparktime" />
              <p className="mt-1.5 text-black/60 text-[10px] uppercase tracking-widest text-muted-foreground">
                Énergie
              </p>
              <p className="mt-1.5 font-mono text-black/70 text-xs font-medium">
                {currentSpark.energyLevel || "Non précisée"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-cream-secondary p-3">
              <MapPin className="h-3.5 w-3.5 text-sparktime" />
              <p className="mt-1.5 text-black/60 text-[10px] uppercase tracking-widest text-muted-foreground">
                Lieu
              </p>
              <p className="mt-1.5 font-mono text-black/70 text-xs font-medium">
                {currentSpark.detail || "Non précisé"}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-[#2B2A28] p-4 text-white">
            <p className="mb-2.5 flex items-center gap-1.5 text-xs font-normal uppercase tracking-widest text-white/70">
              <Sparkles className="h-3.5 w-3.5" />
              Pourquoi cette idée
            </p>
            <p className="text-sm leading-snug">{reason}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="lg"
              onClick={() => onPlan(currentSpark)}
              className="rounded-xl bg-sparktime text-white hover:bg-sparktime/90"
            >
              <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
              Planifier dans FlowDay
            </Button>
            <Button size="sm" variant="secondary" className="rounded-xl">
              <Share2 className="mr-1.5 h-3.5 w-3.5" />
              Partager
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
