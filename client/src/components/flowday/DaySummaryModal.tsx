import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sun, CheckCircle2, Sparkles, Quote, TrendingUp } from "lucide-react";
import { useDayPlanStore } from "@/store/dayPlanStore";
import { useResourceStore, type RediscoveredNote } from "@/store/resourceStore";
import { useHabitStore } from "@/store/habitStore";
import { calculateStreak } from "@/lib/streak";
import { formatDuration } from "@/lib/dateUtils";
import { moduleDotClass } from "@/lib/moduleStyles";
import { cn } from "@/lib/utils";
import type { DayPlanBlock, IHabit } from "@shared/types";

// Fingerprint of a day's blocks (id + done status) — mirrors the server-side
// version in server/src/routes/flowday.ts. Used to detect a stale bilan.
function computeBlocksSignature(blocks: DayPlanBlock[]): string {
  return blocks
    .map((b) => `${b.id}:${b.done ? 1 : 0}`)
    .sort()
    .join(",");
}

interface DaySummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId?: string;
  date?: string;
  blocks: DayPlanBlock[];
  existingTitle?: string;
  existingInsight?: string;
  existingBlocksSignature?: string;
}

export default function DaySummaryModal({
  open,
  onOpenChange,
  planId,
  date,
  blocks,
  existingTitle,
  existingInsight,
  existingBlocksSignature,
}: DaySummaryModalProps) {
  const submitDaySummary = useDayPlanStore((s) => s.submitDaySummary);
  const fetchRediscovery = useResourceStore((s) => s.fetchRediscovery);
  const habits = useHabitStore((s) => s.habits);

  const currentSignature = computeBlocksSignature(blocks);
  const isStale = existingBlocksSignature !== currentSignature;

  const [result, setResult] = useState<{
    title: string;
    insight: string;
  } | null>(
    existingTitle && existingInsight && !isStale
      ? { title: existingTitle, insight: existingInsight }
      : null,
  );
  const [quote, setQuote] = useState<RediscoveredNote | null>(null);
  const [generating, setGenerating] = useState(false);

  const blocksCount = blocks.length;
  const hadExistingResult = !!(existingTitle && existingInsight);

  useEffect(() => {
    if (hadExistingResult && !isStale) {
      fetchRediscovery(1).then((notes) => setQuote(notes[0] ?? null));
      return;
    }
    if (!planId || blocksCount === 0) return;

    void Promise.resolve().then(async () => {
      setGenerating(true);
      const [updated, notes] = await Promise.all([
        submitDaySummary(planId),
        fetchRediscovery(1),
      ]);
      setGenerating(false);
      if (updated?.endOfDaySummary && updated?.endOfDayInsight) {
        setResult({
          title: updated.endOfDaySummary,
          insight: updated.endOfDayInsight,
        });
      }
      setQuote(notes[0] ?? null);
    });
  }, [
    planId,
    blocksCount,
    hadExistingResult,
    isStale,
    submitDaySummary,
    fetchRediscovery,
  ]);

  const dateLabel = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";

  const focusMinutes = blocks
    .filter((b) => b.module === "FlowDay")
    .reduce((sum, b) => sum + b.duration, 0);
  const readingMinutes = blocks
    .filter((b) => b.module === "MindShelf")
    .reduce((sum, b) => sum + b.duration, 0);
  const movementMinutes = blocks
    .filter((b) => b.module === "SparkTime")
    .reduce((sum, b) => sum + b.duration, 0);
  const accomplishments = blocks.filter((b) => b.done);

  const bestStreak = habits.reduce<{ habit: IHabit | null; streak: number }>(
    (best, h) => {
      const streak = calculateStreak(h.completedDates);
      return streak > best.streak ? { habit: h, streak } : best;
    },
    { habit: null, streak: 0 },
  );
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const streakDelta = bestStreak.habit
    ? bestStreak.streak -
      calculateStreak(bestStreak.habit.completedDates, sevenDaysAgo)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-cream p-4 sm:p-7">
        <DialogHeader className="gap-1">
          <DialogTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-black/60">
            <Sun className="h-3.5 w-3.5 text-flowday" />
            Bilan du jour{dateLabel ? ` · ${dateLabel}` : ""}
          </DialogTitle>
        </DialogHeader>

        {generating ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-flowday border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              {hadExistingResult
                ? "Mise à jour de ton bilan..."
                : "Génération de ton bilan..."}
            </p>
          </div>
        ) : !result ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Ajoute des blocs à ta journée avant de générer un bilan.
          </p>
        ) : (
          <div>
            <p className="-mt-2 mb-6 font-display text-2xl italic leading-snug">
              {result.title}
            </p>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="min-w-0 rounded-xl bg-flowday-bg p-4">
                <p className="truncate text-[10px] font-medium tracking-normal text-flowday uppercase sm:text-xs sm:tracking-widest">
                  Focus
                </p>
                <p className="mt-1 truncate font-mono text-[16px] font-normal text-black sm:text-lg">
                  {formatDuration(focusMinutes)}
                </p>
              </div>
              <div className="min-w-0 rounded-xl bg-mindshelf-bg p-4">
                <p className="truncate text-[10px] font-medium tracking-normal text-mindshelf uppercase sm:text-xs sm:tracking-widest">
                  Lecture
                </p>
                <p className="mt-1 truncate font-mono text-[16px] font-normal text-black sm:text-lg">
                  {formatDuration(readingMinutes)}
                </p>
              </div>
              <div className="min-w-0 rounded-xl bg-sparktime-bg p-4">
                <p className="truncate text-[10px] font-medium tracking-normal text-sparktime uppercase sm:text-xs sm:tracking-widest">
                  Mouvement
                </p>
                <p className="mt-1 truncate font-mono text-[16px] font-normal text-black sm:text-lg">
                  {formatDuration(movementMinutes)}
                </p>
              </div>
            </div>

            {accomplishments.length > 0 && (
              <div className="mt-4 rounded-xl bg-cream-secondary p-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-flowday" />
                  Accomplissements
                </p>
                <ul className="space-y-1.5">
                  {accomplishments.map((b) => (
                    <li key={b.id} className="flex items-center gap-2 text-sm">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          moduleDotClass[b.module],
                        )}
                      />
                      {b.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 rounded-xl bg-[#2B2A28] p-4 text-white">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-white/65">
                <Sparkles className="h-3.5 w-3.5" />
                Insight IA
              </p>
              <p className="font-display italic leading-snug">
                {result.insight}
              </p>
            </div>

            {quote && (
              <div className="mt-4 rounded-xl bg-mindshelf-bg p-4">
                {quote.isQuote && (
                  <Quote className="mb-2 h-4 w-4 text-mindshelf" />
                )}
                <p className="text-sm italic">"{quote.content}"</p>
                <p className="mt-1.5 font-mono text-xs text-black/60 text-muted-foreground">
                  Redécouverte · {quote.resourceTitle}
                  {quote.page ? ` p. ${quote.page}` : ""}
                </p>
              </div>
            )}

            {bestStreak.streak > 0 && (
              <div className="mt-4 flex items-center gap-1.5 text-xs text-black/60 text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-flowday" />
                {streakDelta > 0 ? `+${streakDelta} j de streak · ` : ""}
                {bestStreak.streak} jours consécutifs
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
