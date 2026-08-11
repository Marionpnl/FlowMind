import { useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import FlowDayPlanCard from "@/components/widgets/FlowDayPlanCard";
import TodayPlanning from "@/components/widgets/TodayPlanning";
import HabitsWidget from "@/components/widgets/HabitsWidget";
import FocusCard from "@/components/flowday/FocusCard";
import { Button } from "@/components/ui/button";
import { Sun, Plus } from "lucide-react";
import { useDayPlanStore } from "@/store/dayPlanStore";

function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

export default function FlowDay() {
  const today = getTodayDateString();
  const currentPlan = useDayPlanStore((s) => s.currentPlan);
  const fetchPlan = useDayPlanStore((s) => s.fetchPlan);
  const toggleBlock = useDayPlanStore((s) => s.toggleBlock);

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
          <TodayPlanning blocks={blocks} onToggleBlock={toggleBlock} />
        </div>
        <div className="space-y-5">
          <HabitsWidget layout="column" />
          <FocusCard />
        </div>
      </main>
    </div>
  );
}
