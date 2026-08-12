import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import DayTimelineView from "@/components/calendar/DayTimelineView";
import WeekGridView from "@/components/calendar/WeekGridView";
import MonthGridView from "@/components/calendar/MonthGridView";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useDayPlanStore } from "@/store/dayPlanStore";
import { getMonday, toDateString, MONTH_LABELS } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

type ViewMode = "day" | "week" | "month";

export default function Calendar() {
  const [view, setView] = useState<ViewMode>("day");
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentPlan = useDayPlanStore((s) => s.currentPlan);
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
  const pageTitle =
    view === "month" ? `${MONTH_LABELS[month - 1]} ${year}` : "Calendrier";

  return (
    <div className="min-h-screen">
      <PageHeader
        title={pageTitle}
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
              className="bg-flowday text-white hover:bg-flowday/90"
            >
              <Plus className="mr-1 h-4 w-4" />
              Bloc
            </Button>
          </>
        }
      />

      <main className="space-y-5 px-8 py-6">
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

        {view === "day" && <DayTimelineView blocks={blocks} />}
        {view === "week" && (
          <WeekGridView weekStart={weekStart} plans={weekPlans} />
        )}
        {view === "month" && (
          <MonthGridView year={year} month={month} plans={monthPlans} />
        )}
      </main>
    </div>
  );
}
