import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Sparkles } from "lucide-react";
import {
  useSummaryStore,
  type WeeklyBilan,
  type WeeklyStats,
} from "@/store/summaryStore";
import { formatDuration } from "@/lib/dateUtils";
import { moduleDotClass } from "@/lib/moduleStyles";
import { cn } from "@/lib/utils";

interface WeeklyBilanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekStart: string;
  rangeLabel: string;
  stats: WeeklyStats | null;
}

export default function WeeklyBilanModal({
  open,
  onOpenChange,
  weekStart,
  rangeLabel,
  stats,
}: WeeklyBilanModalProps) {
  const generateWeeklyBilan = useSummaryStore((s) => s.generateWeeklyBilan);
  const [result, setResult] = useState<WeeklyBilan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(async () => {
      setGenerating(true);
      const data = await generateWeeklyBilan(weekStart);
      setGenerating(false);
      if (data) {
        setResult(data);
      } else {
        setFailed(true);
      }
    });
  }, [weekStart, generateWeeklyBilan]);

  const displayStats = result?.stats ?? stats;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-cream p-7">
        <DialogHeader className="gap-1">
          <DialogTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-black/60">
            <Calendar className="h-3.5 w-3.5 text-mindshelf" />
            Bilan hebdomadaire · {rangeLabel}
          </DialogTitle>
        </DialogHeader>

        {generating ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-mindshelf border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Génération de ton bilan...
            </p>
          </div>
        ) : failed || !result ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Pas encore assez d'activité cette semaine pour un bilan.
          </p>
        ) : (
          <div>
            <p className="-mt-2 mb-6 font-display text-2xl italic leading-snug">
              {result.title}
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-flowday-bg p-4">
                <p className="text-xs font-medium uppercase tracking-widest text-flowday">
                  Focus
                </p>
                <p className="mt-1 font-mono text-lg font-normal text-black">
                  {formatDuration(displayStats?.focusMinutes ?? 0)}
                </p>
              </div>
              <div className="rounded-xl bg-mindshelf-bg p-4">
                <p className="text-xs font-medium uppercase tracking-widest text-mindshelf">
                  Lecture
                </p>
                <p className="mt-1 font-mono text-lg font-normal text-black">
                  {formatDuration(displayStats?.readingMinutes ?? 0)}
                </p>
              </div>
              <div className="rounded-xl bg-sparktime-bg p-4">
                <p className="text-xs font-medium uppercase tracking-widest text-sparktime">
                  Mouvement
                </p>
                <p className="mt-1 font-mono text-lg font-normal text-black">
                  {formatDuration(displayStats?.movementMinutes ?? 0)}
                </p>
              </div>
            </div>

            {result.highlights.length > 0 && (
              <div className="mt-4 rounded-xl bg-cream-secondary p-4">
                <p className="mb-2 text-xs font-semibold">Points forts</p>
                <ul className="space-y-1.5">
                  {result.highlights.map((h, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          moduleDotClass[h.module],
                        )}
                      />
                      {h.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 rounded-xl bg-[#2B2A28] p-4 text-white">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-white/65">
                <Sparkles className="h-3.5 w-3.5" />
                Synthèse IA
              </p>
              <p className="font-display italic leading-snug">
                {result.synthesis}
              </p>
              {result.actions.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-white/10 pt-3 text-xs text-white/80">
                  {result.actions.map((a, i) => (
                    <li key={i}>· {a}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
