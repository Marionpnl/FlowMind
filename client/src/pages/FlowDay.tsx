import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import FlowDayPlanCard from "@/components/widgets/FlowDayPlanCard";
import TodayPlanning from "@/components/widgets/TodayPlanning";
import HabitsWidget from "@/components/widgets/HabitsWidget";
import FocusCard from "@/components/flowday/FocusCard";
import NewActivityModal from "@/components/widgets/NewActivityModal";
import WeekGridView from "@/components/calendar/WeekGridView";
import MonthGridView from "@/components/calendar/MonthGridView";
import { Button } from "@/components/ui/button";
import { Sun, Plus } from "lucide-react";
import { useDayPlanStore } from "@/store/dayPlanStore";
import { getMonday, toDateString } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

type ViewMode = "day" | "week" | "month";

function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

export default function FlowDay() {
  const today = getTodayDateString();
  const currentPlan = useDayPlanStore((s) => s.currentPlan);
  const weekPlans = useDayPlanStore((s) => s.weekPlans);
  const monthPlans = useDayPlanStore((s) => s.monthPlans);
  const fetchPlan = useDayPlanStore((s) => s.fetchPlan);
  const fetchWeekPlans = useDayPlanStore((s) => s.fetchWeekPlans);
  const fetchMonthPlans = useDayPlanStore((s) => s.fetchMonthPlans);
  const toggleBlock = useDayPlanStore((s) => s.toggleBlock);
  const [newActivityOpen, setNewActivityOpen] = useState(false);
  const [scheduleSession, setScheduleSession] = useState(0);
  const [view, setView] = useState<ViewMode>("day");

  function openNewActivity() {
    setScheduleSession((s) => s + 1);
    setNewActivityOpen(true);
  }

  const now = new Date();
  const weekStart = getMonday(now);
  const weekStartStr = toDateString(weekStart);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  useEffect(() => {
    fetchPlan(today);
  }, [today, fetchPlan]);

  useEffect(() => {
    if (view === "week") fetchWeekPlans(weekStartStr);
    if (view === "month") fetchMonthPlans(year, month);
  }, [view, weekStartStr, year, month, fetchWeekPlans, fetchMonthPlans]);

  const todayLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const blocks = currentPlan?.blocks ?? [];

  return (
    <div className="min-h-screen">
      <PageHeader
        title="FlowDay"
        subtitle={`${todayLabel} · ${blocks.length} blocs planifiés`}
        actions={
          <>
            <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <Sun className="h-4 w-4" />
              Bilan du jour
            </button>
            <Button
              size="sm"
              onClick={openNewActivity}
              className="bg-flowday text-white hover:bg-flowday/90"
            >
              <Plus className="mr-1 h-4 w-4" />
              Planifier la pratique
            </Button>
          </>
        }
      />

      <main className="grid grid-cols-3 gap-5 px-8 py-6">
        <div className="col-span-2 space-y-5">
          <FlowDayPlanCard date={today} />

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

          {view === "day" && (
            <TodayPlanning blocks={blocks} onToggleBlock={toggleBlock} />
          )}
          {view === "week" && (
            <WeekGridView weekStart={weekStart} plans={weekPlans} />
          )}
          {view === "month" && (
            <MonthGridView year={year} month={month} plans={monthPlans} />
          )}
        </div>
        <div className="space-y-5">
          <HabitsWidget layout="column" />
          <FocusCard />
        </div>
      </main>

      <NewActivityModal
        key={scheduleSession}
        open={newActivityOpen}
        onOpenChange={setNewActivityOpen}
        defaultModule="FlowDay"
      />
    </div>
  );
}
