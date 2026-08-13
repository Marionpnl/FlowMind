import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import ContextBanner from "@/components/sparktime/ContextBanner";
import SparkCard from "@/components/sparktime/SparkCard";
import CategoriesPanel from "@/components/sparktime/CategoriesPanel";
import InterestsPanel from "@/components/sparktime/InterestsPanel";
import AdjustSuggestionsPanel from "@/components/sparktime/AdjustSuggestionsPanel";
import { Button } from "@/components/ui/button";
import { useSparkStore } from "@/store/sparkStore";
import { useInterestStore } from "@/store/interestStore";
import { cn } from "@/lib/utils";
import { ENERGY_LEVELS } from "@/lib/sparktime";

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
            size="sm"
            disabled={sparksLoading || interests.length === 0}
            onClick={handleGenerate}
            className="bg-sparktime text-white rounded-xl hover:bg-sparktime/90"
          >
            <RefreshCw
              className={cn("mr-1.5 h-3.5 w-3.5", sparksLoading && "animate-spin")}
            />
            Régénérer
          </Button>
        }
      />

      <main className="grid grid-cols-3 gap-5 px-8 py-6">
        <div className="col-span-2 space-y-6">
          <ContextBanner />

          <div>
            <h2 className="font-display text-2xl italic">Pour toi, maintenant</h2>
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
                {interests.length > 0 && (
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
              <div className="grid grid-cols-2 gap-4">
                {sparks.map((spark) => (
                  <SparkCard key={spark._id} spark={spark} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <CategoriesPanel sparks={sparks} />
          <InterestsPanel interests={interests} />
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
    </div>
  );
}
