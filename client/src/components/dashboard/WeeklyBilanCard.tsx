import { useEffect, useState } from "react";
import { Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import WeeklyBilanModal from "@/components/dashboard/WeeklyBilanModal";
import { useSummaryStore, type WeeklyStats } from "@/store/summaryStore";
import {
  getMonday,
  getWeekDays,
  toDateString,
  formatDuration,
  MONTH_LABELS,
} from "@/lib/dateUtils";

function formatWeekRange(weekDays: Date[]): string {
  const start = weekDays[0];
  const end = weekDays[6];
  const startMonth = MONTH_LABELS[start.getMonth()];
  const endMonth = MONTH_LABELS[end.getMonth()];
  if (startMonth === endMonth) {
    return `${start.getDate()} – ${end.getDate()} ${endMonth.toLowerCase()}`;
  }
  return `${start.getDate()} ${startMonth.slice(0, 3).toLowerCase()}. – ${end.getDate()} ${endMonth.toLowerCase()}`;
}

export default function WeeklyBilanCard() {
  const fetchWeeklyStats = useSummaryStore((s) => s.fetchWeeklyStats);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [session, setSession] = useState(0);

  const weekStart = toDateString(getMonday(new Date()));
  const rangeLabel = formatWeekRange(getWeekDays(getMonday(new Date())));

  useEffect(() => {
    fetchWeeklyStats(weekStart).then((result) => setStats(result));
  }, [weekStart, fetchWeeklyStats]);

  function handleOpen() {
    setSession((s) => s + 1);
    setModalOpen(true);
  }

  const headline = stats
    ? `${formatDuration(stats.focusMinutes)} de focus, ${formatDuration(stats.readingMinutes)} de lecture, ${stats.sparktimeBlocksDone} activité${stats.sparktimeBlocksDone > 1 ? "s" : ""}.`
    : "Pas encore d'activité cette semaine.";

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xs font-medium tracking-widest uppercase">
          <Calendar className="h-4 w-4" />
          Bilan hebdomadaire
        </h2>
        <span className="text-[10px] sm:text-xs font-mono text-black/50 text-muted-foreground">
          {rangeLabel}
        </span>
      </div>

      <p className="mb-4 font-display text-md sm:text-lg italic leading-snug">
        {headline}
      </p>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-flowday-bg p-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-flowday">
            Focus
          </p>
          <p className="mt-1 font-mono text-sm sm:text-base text-black">
            {formatDuration(stats?.focusMinutes ?? 0)}
          </p>
        </div>
        <div className="rounded-xl bg-mindshelf-bg p-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-mindshelf">
            Lecture
          </p>
          <p className="mt-1 font-mono text-sm sm:text-base text-black">
            {formatDuration(stats?.readingMinutes ?? 0)}
          </p>
        </div>
        <div className="rounded-xl bg-sparktime-bg p-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-sparktime">
            Sport
          </p>
          <p className="mt-1 font-mono text-sm sm:text-base text-black">
            {formatDuration(stats?.movementMinutes ?? 0)}
          </p>
        </div>
      </div>

      <Button
        onClick={handleOpen}
        className="w-full h-7 sm:h-8 bg-[#2B2A28] font-normal text-white text-xs sm:text-sm hover:bg-[#2B2A28]/90 rounded-xl cursor-pointer"
      >
        <Sparkles className="mr-1.5 h-4 w-4" />
        Générer le bilan par IA
      </Button>

      <WeeklyBilanModal
        key={session}
        open={modalOpen}
        onOpenChange={setModalOpen}
        weekStart={weekStart}
        rangeLabel={rangeLabel}
        stats={stats}
      />
    </div>
  );
}
