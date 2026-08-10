import PageHeader from "@/components/layout/PageHeader";
import FlowDayPlanCard from "@/components/widgets/FlowDayPlanCard";
import TodayPlanning from "@/components/widgets/TodayPlanning";
import HabitsWidget from "@/components/widgets/HabitsWidget";
import InsightCard from "@/components/dashboard/InsightCard";
import MindShelfCard from "@/components/dashboard/MindShelfCard";
import SparkTimeCard from "@/components/dashboard/SparkTimeCard";
import { Button } from "@/components/ui/button";
import { Sun, Plus } from "lucide-react";
import { todayBlocks } from "@/lib/mockData";
import { useAuthStore } from "@/store/authStore";

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen">
      <PageHeader
        title={today}
        subtitle={`Bonjour ${user?.name} · ${todayBlocks.length} blocs planifiés`}
        actions={
          <>
            <button className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground">
              <Sun className="h-4 w-4" />
              Bilan du jour
            </button>
            <Button
              size="lg"
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
          <FlowDayPlanCard />
          <TodayPlanning />
          <HabitsWidget />
        </div>
        <div className="space-y-5">
          <InsightCard />
          <MindShelfCard />
          <SparkTimeCard />
        </div>
      </main>
    </div>
  );
}
