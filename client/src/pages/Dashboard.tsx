import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import FlowDayPlanCard from "@/components/widgets/FlowDayPlanCard";
import TodayPlanning from "@/components/widgets/TodayPlanning";
import HabitsWidget from "@/components/widgets/HabitsWidget";
import InsightCard from "@/components/dashboard/InsightCard";
import MindShelfCard from "@/components/dashboard/MindShelfCard";
import SparkTimeCard from "@/components/dashboard/SparkTimeCard";
import NewActivityModal from "@/components/widgets/NewActivityModal";
import { Button } from "@/components/ui/button";
import { Sun, Plus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useDayPlanStore } from "@/store/dayPlanStore";

function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const today = getTodayDateString();
  const currentPlan = useDayPlanStore((s) => s.currentPlan);
  const fetchPlan = useDayPlanStore((s) => s.fetchPlan);
  const toggleBlock = useDayPlanStore((s) => s.toggleBlock);
  const deleteBlock = useDayPlanStore((s) => s.deleteBlock);
  const [newActivityOpen, setNewActivityOpen] = useState(false);
  const [scheduleSession, setScheduleSession] = useState(0);

  function openNewActivity() {
    setScheduleSession((s) => s + 1);
    setNewActivityOpen(true);
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

  return (
    <div className="min-h-screen">
      <PageHeader
        title={todayLabel}
        subtitle={`Bonjour ${user?.name} · ${blocks.length} blocs planifiés`}
        actions={
          <>
            <button className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground">
              <Sun className="h-4 w-4" />
              Bilan du jour
            </button>
            <Button
              size="lg"
              onClick={openNewActivity}
              className="bg-[#2B2A28] text-white hover:bg-flowday/90 rounded-xl"
            >
              <Plus className="mr-1 h-4 w-4" />
              Nouvelle activité
            </Button>
          </>
        }
      />

      <main className="grid grid-cols-3 gap-5 px-8 py-6">
        <div className="col-span-2 space-y-5">
          <FlowDayPlanCard date={today} />
          <TodayPlanning
            blocks={blocks}
            onToggleBlock={toggleBlock}
            onDeleteBlock={deleteBlock}
          />
          <HabitsWidget />
        </div>
        <div className="space-y-5">
          <InsightCard />
          <MindShelfCard />
          <SparkTimeCard />
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
