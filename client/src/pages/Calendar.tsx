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
          <>
            <button
              onClick={goToPrevious}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToToday}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Aujourd'hui
            </button>
            <button
              onClick={goToNext}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <Button
              size="sm"
              onClick={openNewActivity}
              className="bg-flowday text-white hover:bg-flowday/90"
            >
              <Plus className="mr-1 h-4 w-4" />
              Bloc
            </Button>
          </>
        }
      />

      <main className="space-y-5 px-8 py-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl italic">{periodLabel}</h2>
          <div className="flex items-center gap-1">
            {(["day", "week", "month"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
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
