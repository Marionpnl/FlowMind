import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import ContextBanner from "@/components/sparktime/ContextBanner";
import SparkCard from "@/components/sparktime/SparkCard";
import CategoriesPanel from "@/components/sparktime/CategoriesPanel";
import InterestsPanel from "@/components/sparktime/InterestsPanel";
import AdjustSuggestionsPanel from "@/components/sparktime/AdjustSuggestionsPanel";
import InterestsModal from "@/components/sparktime/InterestsModal";
import SparkDetailsModal from "@/components/sparktime/SparkDetailsModal";
import NewActivityModal from "@/components/widgets/NewActivityModal";
import { Button } from "@/components/ui/button";
import { useSparkStore } from "@/store/sparkStore";
import { useInterestStore } from "@/store/interestStore";
import { cn } from "@/lib/utils";
import { ENERGY_LEVELS } from "@/lib/sparktime";
import type { ISpark } from "@shared/types";

export default function SparkTime() {
  const sparks = useSparkStore((s) => s.sparks);
  const sparksLoading = useSparkStore((s) => s.loading);
  const fetchSparks = useSparkStore((s) => s.fetchSparks);
  const generateSparks = useSparkStore((s) => s.generateSparks);

  const interests = useInterestStore((s) => s.interests);
  const fetchInterests = useInterestStore((s) => s.fetchInterests);

  const [maxDuration, setMaxDuration] = useState(60);
  const [maxDistance, setMaxDistance] = useState(5);
  const [energyIndex, setEnergyIndex] = useState(1);
  const [interestsModalOpen, setInterestsModalOpen] = useState(false);
  const [selectedSpark, setSelectedSpark] = useState<ISpark | null>(null);
  const [schedulingSpark, setSchedulingSpark] = useState<ISpark | null>(null);
  const [scheduleSession, setScheduleSession] = useState(0);

  const liveSelectedSpark = selectedSpark
    ? (sparks.find((s) => s._id === selectedSpark._id) ?? null)
    : null;

  function planSpark(spark: ISpark) {
    setSelectedSpark(null);
    setSchedulingSpark(spark);
    setScheduleSession((s) => s + 1);
  }

  function scheduleNotesFor(spark: ISpark) {
    const parts = [spark.description];
    if (spark.energyLevel) parts.push(`énergie ${spark.energyLevel}`);
    return parts.join(" · ");
  }

  useEffect(() => {
    fetchSparks();
    fetchInterests();
  }, [fetchSparks, fetchInterests]);

  function handleGenerate() {
    generateSparks({
      maxDuration,
      maxDistance,
      energyLevel: ENERGY_LEVELS[energyIndex],
    });
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title="SparkTime"
        subtitle={`${sparks.length} idée${sparks.length > 1 ? "s" : ""} générée${sparks.length > 1 ? "s" : ""}`}
        actions={
          <Button
            size="lg"
            disabled={sparksLoading || interests.length === 0}
            onClick={handleGenerate}
            className="h-6 sm:h-7 gap-1 whitespace-nowrap rounded-xl bg-sparktime px-1.5 sm:px-2.5 text-[10px] text-white hover:bg-sparktime/90 lg:h-9 lg:gap-1.5 lg:px-2.5 lg:text-sm"
          >
            <RefreshCw
              className={cn(
                "h-2.5 w-2.5 sm:mr-1 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4",
                sparksLoading && "animate-spin",
              )}
            />
            Régénérer
          </Button>
        }
      />

      <main className="grid grid-cols-1 gap-5 px-4 py-6 sm:px-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ContextBanner />

          <div>
            <h2 className="font-display text-xl italic sm:text-2xl">
              Pour toi, maintenant
            </h2>
            <p className="mb-4 mt-0.5 text-xs text-black/70 text-muted-foreground">
              {sparks.length} idée{sparks.length > 1 ? "s" : ""} à explorer
            </p>

            {sparks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/10 bg-white p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {interests.length === 0
                    ? "Ajoute d'abord des centres d'intérêt pour recevoir des suggestions."
                    : "Aucune suggestion pour l'instant."}
                </p>
                {interests.length === 0 ? (
                  <Button
                    size="sm"
                    onClick={() => setInterestsModalOpen(true)}
                    className="mt-4 bg-sparktime text-white rounded-xl hover:bg-sparktime/90"
                  >
                    Ajouter un centre d'intérêt
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleGenerate}
                    disabled={sparksLoading}
                    className="mt-4 bg-sparktime text-white rounded-xl hover:bg-sparktime/90"
                  >
                    Générer des suggestions
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {sparks.map((spark) => (
                  <SparkCard
                    key={spark._id}
                    spark={spark}
                    onDetails={() => setSelectedSpark(spark)}
                    onPlan={() => planSpark(spark)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <CategoriesPanel sparks={sparks} />
          <InterestsPanel
            interests={interests}
            onManage={() => setInterestsModalOpen(true)}
          />
          <AdjustSuggestionsPanel
            maxDuration={maxDuration}
            onMaxDurationChange={setMaxDuration}
            maxDistance={maxDistance}
            onMaxDistanceChange={setMaxDistance}
            energyIndex={energyIndex}
            onEnergyIndexChange={setEnergyIndex}
          />
        </div>
      </main>

      <InterestsModal
        open={interestsModalOpen}
        onOpenChange={setInterestsModalOpen}
      />
      <SparkDetailsModal
        spark={liveSelectedSpark}
        onOpenChange={(open) => !open && setSelectedSpark(null)}
        onPlan={planSpark}
      />
      <NewActivityModal
        key={scheduleSession}
        open={!!schedulingSpark}
        onOpenChange={(open) => !open && setSchedulingSpark(null)}
        defaultModule="SparkTime"
        defaultTitle={schedulingSpark?.title}
        defaultNotes={schedulingSpark ? scheduleNotesFor(schedulingSpark) : ""}
        defaultDuration={schedulingSpark?.duration}
        sparkId={schedulingSpark?._id}
      />
    </div>
  );
}
