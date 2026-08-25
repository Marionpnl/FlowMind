import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import DayTimelineView from "@/components/calendar/DayTimelineView";
import WeekGridView from "@/components/calendar/WeekGridView";
import MonthGridView from "@/components/calendar/MonthGridView";
import NewActivityModal, {
  type ActivityModalTarget,
} from "@/components/widgets/NewActivityModal";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useDayPlanStore } from "@/store/dayPlanStore";
import { getMonday, toDateString, formatPeriodLabel } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import type { DayPlanBlock } from "@shared/types";

type ViewMode = "day" | "week" | "month";

export default function Calendar() {
  const [view, setView] = useState<ViewMode>("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activityModal, setActivityModal] =
    useState<ActivityModalTarget | null>(null);
  const [modalSession, setModalSession] = useState(0);

  function openNewActivity() {
    setModalSession((s) => s + 1);
    setActivityModal({ mode: "create" });
  }

  function openEditBlock(block: DayPlanBlock, date: string) {
    setModalSession((s) => s + 1);
    setActivityModal({ mode: "edit", block, date });
  }

  const currentPlan = useDayPlanStore((s) => s.currentPlan);
  const deleteBlock = useDayPlanStore((s) => s.deleteBlock);
  const weekPlans = useDayPlanStore((s) => s.weekPlans);
  const monthPlans = useDayPlanStore((s) => s.monthPlans);
  const fetchPlan = useDayPlanStore((s) => s.fetchPlan);
  const fetchWeekPlans = useDayPlanStore((s) => s.fetchWeekPlans);
  const fetchMonthPlans = useDayPlanStore((s) => s.fetchMonthPlans);

  const dateStr = toDateString(currentDate);
  const weekStart = getMonday(currentDate);
  const weekStartStr = toDateString(weekStart);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    if (view === "day") fetchPlan(dateStr);
    if (view === "week") fetchWeekPlans(weekStartStr);
    if (view === "month") fetchMonthPlans(year, month);
  }, [
    view,
    dateStr,
    weekStartStr,
    year,
    month,
    fetchPlan,
    fetchWeekPlans,
    fetchMonthPlans,
  ]);

  function goToPrevious() {
    const d = new Date(currentDate);
    if (view === "week") d.setDate(d.getDate() - 7);
    else if (view === "month") d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  }

  function goToNext() {
    const d = new Date(currentDate);
    if (view === "week") d.setDate(d.getDate() + 7);
    else if (view === "month") d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  const blocks = currentPlan?.blocks ?? [];
  const editingBlock =
    activityModal?.mode === "edit" ? activityModal.block : undefined;
  const editingDate =
    activityModal?.mode === "edit" ? activityModal.date : undefined;
  const periodLabel = formatPeriodLabel(view, currentDate);

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Calendrier"
        subtitle={
          view === "day" ? `${blocks.length} blocs planifiés` : undefined
        }
        actions={
          <div className="flex items-center gap-1 sm:gap-3">
            <button
              onClick={goToToday}
              className="whitespace-nowrap text-[10px] text-black/70 text-muted-foreground hover:text-foreground lg:text-sm cursor-pointer"
            >
              Aujourd'hui
            </button>
            <Button
              size="lg"
              onClick={openNewActivity}
              className="h-6 sm:h-7 gap-1 whitespace-nowrap rounded-xl bg-flowday px-1.5 sm:px-2.5 text-[10px] text-white hover:bg-flowday/90 lg:h-9 lg:gap-1.5 lg:px-2.5 lg:text-sm cursor-pointer"
            >
              <Plus className="h-2.5 w-2.5 sm:mr-1 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
              Bloc
            </Button>
          </div>
        }
      />

      <main className="space-y-5 px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <button
              onClick={goToPrevious}
              className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Période précédente"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="min-w-0 truncate font-display text-lg italic leading-none sm:text-2xl">
              {periodLabel}
            </h2>
            <button
              onClick={goToNext}
              className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Période suivante"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-0 sm:gap-1">
            {(["day", "week", "month"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "whitespace-nowrap rounded-full px-1.5 py-1 text-[10px] font-medium transition-colors sm:px-3 sm:text-xs cursor-pointer",
                  view === v
                    ? "bg-[#2B2A28] text-white"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v === "day" ? "Jour" : v === "week" ? "Semaine" : "Mois"}
              </button>
            ))}
          </div>
        </div>

        {view === "day" && (
          <DayTimelineView
            blocks={blocks}
            onDeleteBlock={deleteBlock}
            onEditBlock={(block) => openEditBlock(block, dateStr)}
          />
        )}
        {view === "week" && (
          <WeekGridView
            weekStart={weekStart}
            plans={weekPlans}
            onDeleteBlock={deleteBlock}
            onEditBlock={openEditBlock}
          />
        )}
        {view === "month" && (
          <MonthGridView
            year={year}
            month={month}
            plans={monthPlans}
            onDeleteBlock={deleteBlock}
            onEditBlock={openEditBlock}
          />
        )}
      </main>

      <NewActivityModal
        key={modalSession}
        open={!!activityModal}
        onOpenChange={(open) => !open && setActivityModal(null)}
        defaultModule={editingBlock?.module ?? "FlowDay"}
        defaultTitle={editingBlock?.title}
        defaultNotes={editingBlock?.subtitle}
        defaultDuration={editingBlock?.duration}
        defaultDate={editingDate ?? dateStr}
        defaultTime={editingBlock?.time}
        editingBlockId={editingBlock?.id}
      />
    </div>
  );
}
