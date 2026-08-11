import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import DayTimelineView from "@/components/calendar/DayTimelineView";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useDayPlanStore } from "@/store/dayPlanStore";
import { cn } from "@/lib/utils";

type ViewMode = "day" | "week" | "month";

function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

export default function Calendar() {
  const [view, setView] = useState<ViewMode>("day");
  const today = getTodayDateString();
  const currentPlan = useDayPlanStore((s) => s.currentPlan);
  const fetchPlan = useDayPlanStore((s) => s.fetchPlan);

  useEffect(() => {
    fetchPlan(today);
  }, [today, fetchPlan]);

  const blocks = currentPlan?.blocks ?? [];

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Calendrier"
        subtitle={`${blocks.length} blocs planifiés`}
        actions={
          <Button
            size="sm"
            className="bg-flowday text-white hover:bg-flowday/90"
          >
            <Plus className="mr-1 h-4 w-4" />
            Bloc
          </Button>
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
          <p className="text-sm text-muted-foreground">Vue Semaine — à venir</p>
        )}
        {view === "month" && (
          <p className="text-sm text-muted-foreground">Vue Mois — à venir</p>
        )}
      </main>
    </div>
  );
}
