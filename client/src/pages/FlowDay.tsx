import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import FlowDayPlanCard from "@/components/widgets/FlowDayPlanCard";
import TodayPlanning from "@/components/widgets/TodayPlanning";
import HabitsWidget from "@/components/widgets/HabitsWidget";
import FocusCard from "@/components/flowday/FocusCard";
import NewActivityModal, {
  type ActivityModalTarget,
} from "@/components/widgets/NewActivityModal";
import DaySummaryModal from "@/components/flowday/DaySummaryModal";
import WeekGridView from "@/components/calendar/WeekGridView";
import MonthGridView from "@/components/calendar/MonthGridView";
import { Button } from "@/components/ui/button";
import { Sun, Plus } from "lucide-react";
import { useDayPlanStore } from "@/store/dayPlanStore";
import {
  getMonday,
  toDateString,
  formatPeriodLabel,
  summarizeBlocks,
} from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import type { DayPlanBlock } from "@shared/types";

type ViewMode = "day" | "week" | "month";

export default function FlowDay() {
  const today = toDateString(new Date());
  const currentPlan = useDayPlanStore((s) => s.currentPlan);
  const weekPlans = useDayPlanStore((s) => s.weekPlans);
  const monthPlans = useDayPlanStore((s) => s.monthPlans);
  const fetchPlan = useDayPlanStore((s) => s.fetchPlan);
  const fetchWeekPlans = useDayPlanStore((s) => s.fetchWeekPlans);
  const fetchMonthPlans = useDayPlanStore((s) => s.fetchMonthPlans);
  const toggleBlock = useDayPlanStore((s) => s.toggleBlock);
  const deleteBlock = useDayPlanStore((s) => s.deleteBlock);
  const [activityModal, setActivityModal] =
    useState<ActivityModalTarget | null>(null);
  const [modalSession, setModalSession] = useState(0);
  const [view, setView] = useState<ViewMode>("day");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summarySession, setSummarySession] = useState(0);

  function openNewActivity() {
    setModalSession((s) => s + 1);
    setActivityModal({ mode: "create" });
  }

  function openEditBlock(block: DayPlanBlock, date: string) {
    setModalSession((s) => s + 1);
    setActivityModal({ mode: "edit", block, date });
  }

  function openDaySummary() {
    setSummarySession((s) => s + 1);
    setSummaryOpen(true);
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

  const todayLabelRaw = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const todayLabel =
    todayLabelRaw.charAt(0).toUpperCase() + todayLabelRaw.slice(1);

  const blocks = currentPlan?.blocks ?? [];
  const editingBlock =
    activityModal?.mode === "edit" ? activityModal.block : undefined;
  const editingDate =
    activityModal?.mode === "edit" ? activityModal.date : undefined;

  const headingTitle =
    view === "day" ? "Aujourd'hui" : formatPeriodLabel(view, now);
  const periodBlocks =
    view === "day"
      ? blocks
      : view === "week"
        ? weekPlans.flatMap((p) => p.blocks)
        : monthPlans.flatMap((p) => p.blocks);
  const headingSubtitle = summarizeBlocks(periodBlocks);

  return (
    <div className="min-h-screen">
      <PageHeader
        title="FlowDay"
        subtitle={todayLabel}
        actions={
          <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
            <button
              onClick={openDaySummary}
              disabled={!currentPlan}
              className="flex items-center gap-2 whitespace-nowrap text-[10px] text-black/70 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 lg:text-sm"
            >
              <Sun className="h-4 w-4" />
              Bilan du jour
            </button>
            <Button
              size="lg"
              onClick={openNewActivity}
              className="h-6 sm:h-7 gap-1 whitespace-nowrap rounded-xl bg-flowday px-1.5 sm:px-2.5 text-[10px] text-white hover:bg-flowday/90 lg:h-9 lg:gap-1.5 lg:px-2.5 lg:text-sm"
            >
              <Plus className="h-2.5 w-2.5 sm:mr-1 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
              Planifier la pratique
            </Button>
          </div>
        }
      />

      <main className="grid grid-cols-1 gap-5 px-4 py-6 sm:px-8 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <FlowDayPlanCard date={today} />

          <div>
            <h2 className="font-display text-xl italic sm:text-2xl">
              {headingTitle}
            </h2>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-black/70 text-muted-foreground sm:text-xs">
                {headingSubtitle}
              </p>
              <div className="flex items-center gap-0 sm:gap-1">
                {(["day", "week", "month"] as ViewMode[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      "rounded-full px-1.5 py-0.5 sm:py-1 text-[10px] font-medium transition-colors sm:px-3 sm:text-xs",
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
          </div>

          {view === "day" && (
            <TodayPlanning
              blocks={blocks}
              onToggleBlock={toggleBlock}
              onDeleteBlock={deleteBlock}
              onEditBlock={(block) => openEditBlock(block, today)}
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
        </div>
        <div className="space-y-5">
          <HabitsWidget layout="column" />
          <FocusCard blocks={blocks} />
        </div>
      </main>

      <NewActivityModal
        key={modalSession}
        open={!!activityModal}
        onOpenChange={(open) => !open && setActivityModal(null)}
        defaultModule={editingBlock?.module ?? "FlowDay"}
        defaultTitle={editingBlock?.title}
        defaultNotes={editingBlock?.subtitle}
        defaultDuration={editingBlock?.duration}
        defaultDate={editingDate}
        defaultTime={editingBlock?.time}
        editingBlockId={editingBlock?.id}
      />

      <DaySummaryModal
        key={summarySession}
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        planId={currentPlan?._id}
        date={currentPlan?.date}
        blocks={blocks}
        existingTitle={currentPlan?.endOfDaySummary}
        existingInsight={currentPlan?.endOfDayInsight}
        existingBlocksSignature={currentPlan?.endOfDayBlocksSignature}
      />
    </div>
  );
}
