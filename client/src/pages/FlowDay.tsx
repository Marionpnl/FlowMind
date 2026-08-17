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

  const todayLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const blocks = currentPlan?.blocks ?? [];
  const editingBlock =
    activityModal?.mode === "edit" ? activityModal.block : undefined;
  const editingDate =
    activityModal?.mode === "edit" ? activityModal.date : undefined;

  const headingTitle = view === "day" ? "Aujourd'hui" : formatPeriodLabel(view, now);
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
        subtitle={`${todayLabel} · ${blocks.length} blocs planifiés`}
        actions={
          <>
            <button
              onClick={openDaySummary}
              disabled={!currentPlan}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
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

          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl italic">{headingTitle}</h2>
              <p className="text-xs text-muted-foreground">
                {headingSubtitle}
              </p>
            </div>
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
          <FocusCard />
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
