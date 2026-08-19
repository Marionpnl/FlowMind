import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import FlowDayPlanCard from "@/components/widgets/FlowDayPlanCard";
import TodayPlanning from "@/components/widgets/TodayPlanning";
import HabitsWidget from "@/components/widgets/HabitsWidget";
import InsightCard from "@/components/dashboard/InsightCard";
import MindShelfCard from "@/components/dashboard/MindShelfCard";
import SparkTimeCard from "@/components/dashboard/SparkTimeCard";
import WeeklyBilanCard from "@/components/dashboard/WeeklyBilanCard";
import NewActivityModal, {
  type ActivityModalTarget,
} from "@/components/widgets/NewActivityModal";
import DaySummaryModal from "@/components/flowday/DaySummaryModal";
import { Button } from "@/components/ui/button";
import { Sun, Plus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useDayPlanStore } from "@/store/dayPlanStore";
import { summarizeBlocks, toDateString } from "@/lib/dateUtils";
import type { DayPlanBlock } from "@shared/types";

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const today = toDateString(new Date());
  const currentPlan = useDayPlanStore((s) => s.currentPlan);
  const fetchPlan = useDayPlanStore((s) => s.fetchPlan);
  const toggleBlock = useDayPlanStore((s) => s.toggleBlock);
  const deleteBlock = useDayPlanStore((s) => s.deleteBlock);
  const [activityModal, setActivityModal] =
    useState<ActivityModalTarget | null>(null);
  const [modalSession, setModalSession] = useState(0);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summarySession, setSummarySession] = useState(0);

  function openNewActivity() {
    setModalSession((s) => s + 1);
    setActivityModal({ mode: "create" });
  }

  function openEditBlock(block: DayPlanBlock) {
    setModalSession((s) => s + 1);
    setActivityModal({ mode: "edit", block, date: today });
  }

  function openDaySummary() {
    setSummarySession((s) => s + 1);
    setSummaryOpen(true);
  }

  useEffect(() => {
    fetchPlan(today);
  }, [today, fetchPlan]);

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

  return (
    <div className="min-h-screen">
      <PageHeader
        title={todayLabel}
        subtitle={`Bonjour ${user?.name}`}
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
              className="h-6 sm:h-7 gap-1 whitespace-nowrap rounded-xl bg-[#2B2A28] px-1.5 sm:px-2.5 text-[10px] text-white hover:bg-flowday/90 lg:h-9 lg:gap-1.5 lg:px-2.5 lg:text-sm"
            >
              <Plus className="h-2.5 w-2.5 sm:mr-1 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
              Nouvelle activité
            </Button>
          </div>
        }
      />

      <main className="grid grid-cols-1 gap-5 px-4 py-6 sm:px-8 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <FlowDayPlanCard date={today} />
          <div>
            <h2 className="font-display text-xl sm:text-2xl italic">
              Aujourd'hui
            </h2>
            <p className="pt-0.5 text-black/70 text-xs text-muted-foreground">
              {summarizeBlocks(blocks)}
            </p>
          </div>
          <TodayPlanning
            blocks={blocks}
            onToggleBlock={toggleBlock}
            onDeleteBlock={deleteBlock}
            onEditBlock={openEditBlock}
          />
          <HabitsWidget layout="responsive" />
        </div>
        <div className="space-y-5">
          <InsightCard />
          <MindShelfCard />
          <SparkTimeCard />
          <WeeklyBilanCard />
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
