import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import ContextBanner from "@/components/sparktime/ContextBanner";
import SparkCard from "@/components/sparktime/SparkCard";
import LocalEventCard from "@/components/sparktime/LocalEventCard";
import CategoriesPanel from "@/components/sparktime/CategoriesPanel";
import InterestsPanel from "@/components/sparktime/InterestsPanel";
import AdjustSuggestionsPanel from "@/components/sparktime/AdjustSuggestionsPanel";
import InterestsModal from "@/components/sparktime/InterestsModal";
import SparkDetailsModal from "@/components/sparktime/SparkDetailsModal";
import NewActivityModal from "@/components/widgets/NewActivityModal";
import { Button } from "@/components/ui/button";
import { useSparkStore } from "@/store/sparkStore";
import { useInterestStore } from "@/store/interestStore";
import { useDayPlanStore } from "@/store/dayPlanStore";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { ENERGY_LEVELS, MAX_FINITE_DISTANCE_KM } from "@/lib/sparktime";
import { toDateString } from "@/lib/dateUtils";
import apiCall from "@/lib/api";
import type { ISpark, ILocalEvent } from "@shared/types";

interface CurrentWeather {
  temperature: number;
  condition: string;
}

function minutesUntilNextActivity(
  blocks: { time: string; duration: number; done: boolean }[],
): number | null {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const upcoming = blocks
    .filter((b) => !b.done)
    .map((b) => {
      const [h, m] = b.time.split(":").map(Number);
      return h * 60 + m;
    })
    .filter((startMinutes) => startMinutes >= nowMinutes)
    .sort((a, b) => a - b);
  return upcoming.length > 0 ? upcoming[0] - nowMinutes : null;
}

export default function SparkTime() {
  const sparks = useSparkStore((s) => s.sparks);
  const sparksLoading = useSparkStore((s) => s.loading);
  const fetchSparks = useSparkStore((s) => s.fetchSparks);
  const generateSparks = useSparkStore((s) => s.generateSparks);
  const deleteSpark = useSparkStore((s) => s.deleteSpark);

  const interests = useInterestStore((s) => s.interests);
  const fetchInterests = useInterestStore((s) => s.fetchInterests);

  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const currentPlan = useDayPlanStore((s) => s.currentPlan);
  const fetchPlan = useDayPlanStore((s) => s.fetchPlan);
  const [weather, setWeather] = useState<CurrentWeather | null>(null);

  // Valeur initiale lue directement sur le compte (persistée côté serveur,
  // voir updateSparkPrefs plus bas) — `user` est garanti déjà chargé ici,
  // ProtectedRoute bloque le rendu de cette page tant que ce n'est pas le
  // cas. État local quand même conservé (pas juste dérivé de `user` à chaque
  // rendu) pour que le slider reste réactif au glissé sans attendre
  // l'aller-retour réseau à chaque tick.
  const [maxDuration, setMaxDuration] = useState(
    () => user?.preferences?.sparkMaxDuration ?? 60,
  );
  const [maxDistance, setMaxDistance] = useState(
    () => user?.preferences?.sparkMaxDistance ?? 5,
  );
  const [energyIndex, setEnergyIndex] = useState(
    () => user?.preferences?.sparkEnergyIndex ?? 1,
  );
  const [interestsModalOpen, setInterestsModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [selectedSpark, setSelectedSpark] = useState<ISpark | null>(null);
  const [schedulingSpark, setSchedulingSpark] = useState<ISpark | null>(null);
  const [localEvents, setLocalEvents] = useState<ILocalEvent[]>([]);
  const [schedulingEvent, setSchedulingEvent] = useState<ILocalEvent | null>(
    null,
  );
  const [scheduleSession, setScheduleSession] = useState(0);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const liveSelectedSpark = selectedSpark
    ? (sparks.find((s) => s._id === selectedSpark._id) ?? null)
    : null;

  // Au-delà de MAX_FINITE_DISTANCE_KM, le slider représente "pas de limite"
  // plutôt qu'un chiffre — voir lib/sparktime.ts.
  const maxDistanceKm =
    maxDistance > MAX_FINITE_DISTANCE_KM ? null : maxDistance;

  // Persiste sur le compte (PUT /api/auth/me, via authStore.updateProfile
  // déjà existant) — synchronisé sur tous les appareils, plus de
  // localStorage. `patch` prévaut sur l'état local encore possiblement
  // périmé (un seul champ change par appel, les deux autres viennent de la
  // closure).
  function updateSparkPrefs(patch: {
    maxDuration?: number;
    maxDistance?: number;
    energyIndex?: number;
  }) {
    updateProfile({
      preferences: {
        sparkMaxDuration: patch.maxDuration ?? maxDuration,
        sparkMaxDistance: patch.maxDistance ?? maxDistance,
        sparkEnergyIndex: patch.energyIndex ?? energyIndex,
      },
    });
  }

  function planSpark(spark: ISpark) {
    setSelectedSpark(null);
    setSchedulingEvent(null);
    setSchedulingSpark(spark);
    setScheduleSession((s) => s + 1);
  }

  function scheduleNotesFor(spark: ISpark) {
    const parts = [spark.description];
    if (spark.energyLevel) parts.push(`énergie ${spark.energyLevel}`);
    return parts.join(" · ");
  }

  function planEvent(event: ILocalEvent) {
    setSchedulingSpark(null);
    setSchedulingEvent(event);
    setScheduleSession((s) => s + 1);
  }

  function scheduleNotesForEvent(event: ILocalEvent) {
    const parts = [event.venue, event.city].filter(Boolean) as string[];
    parts.push(event.url);
    return parts.join(" · ");
  }

  // Retrait optimiste immédiat + mémorisé côté serveur (le prochain fetch,
  // sur cet appareil ou un autre, l'exclut déjà — voir GET /api/local-events
  // qui filtre par `dismissedLocalEventIds`). En cas d'échec réseau, l'id
  // n'est pas mémorisé mais la carte reste retirée localement pour cette
  // session — pas grave, elle réapparaîtrait juste au prochain fetch.
  function deleteEvent(event: ILocalEvent) {
    setLocalEvents((prev) => prev.filter((e) => e.id !== event.id));
    void apiCall(`/api/local-events/${event.id}`, {
      method: "DELETE",
      auth: true,
    }).catch(() => {});
  }

  useEffect(() => {
    fetchSparks();
    fetchInterests();
    fetchPlan(toDateString(new Date()));
  }, [fetchSparks, fetchInterests, fetchPlan]);

  // Pas de fausse météo : on n'affiche une valeur que si l'appel réussit
  // vraiment (pas de lieu renseigné ou clé OpenWeather absente => rien).
  // Différé en microtâche pour ne pas déclencher de setState synchrone en
  // tout début de useEffect.
  useEffect(() => {
    void Promise.resolve().then(async () => {
      if (!user?.location) {
        setWeather(null);
        return;
      }
      try {
        const res = await apiCall<{ data: CurrentWeather }>("/api/weather", {
          auth: true,
        });
        setWeather(res.data);
      } catch {
        setWeather(null);
      }
    });
  }, [user?.location]);

  // Même logique que la météo : pas d'événement affiché si l'appel échoue
  // (pas de lieu renseigné, pas de clé Ticketmaster, ou aucun résultat) —
  // jamais d'événement inventé en repli. `maxDistance` réutilise le même
  // slider que la génération de Sparks (pilote le rayon de recherche
  // Ticketmaster côté serveur) — débounce de 500ms (même pattern que la
  // recherche de titre dans NewResourceModal.tsx) pour ne pas déclencher un
  // appel à chaque tick pendant qu'on glisse le curseur. Les événements déjà
  // masqués par l'utilisatrice sont filtrés côté serveur (dismissedLocalEventIds
  // sur le compte), pas ici — cohérent sur tous ses appareils.
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!user?.location) {
        setLocalEvents([]);
        return;
      }
      try {
        const distanceParam = maxDistanceKm === null ? "none" : maxDistanceKm;
        const res = await apiCall<{ data: ILocalEvent[] }>(
          `/api/local-events?maxDistance=${distanceParam}`,
          { auth: true },
        );
        setLocalEvents(res.data);
      } catch {
        setLocalEvents([]);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [user?.location, user?._id, maxDistanceKm]);

  function handleGenerate() {
    generateSparks({
      maxDuration,
      maxDistance: maxDistanceKm ?? undefined,
      energyLevel: ENERGY_LEVELS[energyIndex],
    });
  }

  function toggleCategoryFilter(category: string) {
    setCategoryFilter((prev) => (prev === category ? null : category));
    suggestionsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const visibleSparks = categoryFilter
    ? sparks.filter((s) => (s.category || "Autre") === categoryFilter)
    : sparks;

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
            className="h-6 sm:h-7 gap-1 whitespace-nowrap rounded-xl bg-sparktime px-2 sm:px-2.5 text-[11px] text-white hover:bg-sparktime/90 lg:h-9 lg:gap-1.5 lg:px-2.5 lg:text-sm"
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
          <ContextBanner
            location={user?.location}
            energyLabel={ENERGY_LEVELS[energyIndex]}
            nextActivityMinutes={minutesUntilNextActivity(
              currentPlan?.blocks ?? [],
            )}
            weather={weather}
          />

          <div ref={suggestionsRef}>
            <h2 className="font-display text-xl italic sm:text-2xl">
              Pour toi, maintenant
            </h2>
            <p className="mb-4 mt-0.5 text-xs text-black/70 text-muted-foreground">
              {visibleSparks.length + localEvents.length} idée
              {visibleSparks.length + localEvents.length > 1 ? "s" : ""} à
              explorer
              {categoryFilter && (
                <>
                  {" "}
                  ·{" "}
                  <button
                    onClick={() => setCategoryFilter(null)}
                    className="underline hover:text-foreground cursor-pointer"
                  >
                    Réinitialiser le filtre
                  </button>
                </>
              )}
            </p>

            {sparks.length === 0 && localEvents.length === 0 ? (
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
            ) : visibleSparks.length === 0 && localEvents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/10 bg-white p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucune idée dans cette catégorie.
                </p>
              </div>
            ) : (
              // Événements réels et Sparks générés par l'IA mêlés dans la
              // même grille (pas de bloc "Événements" séparé).
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {localEvents.map((event) => (
                  <LocalEventCard
                    key={event.id}
                    event={event}
                    onPlan={() => planEvent(event)}
                    onDelete={() => deleteEvent(event)}
                  />
                ))}
                {visibleSparks.map((spark) => (
                  <SparkCard
                    key={spark._id}
                    spark={spark}
                    onDetails={() => setSelectedSpark(spark)}
                    onPlan={() => planSpark(spark)}
                    onDelete={() => deleteSpark(spark._id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <CategoriesPanel
            sparks={sparks}
            activeCategory={categoryFilter}
            onSelectCategory={toggleCategoryFilter}
          />
          <InterestsPanel
            interests={interests}
            onManage={() => setInterestsModalOpen(true)}
          />
          <AdjustSuggestionsPanel
            maxDuration={maxDuration}
            onMaxDurationChange={(v) => {
              setMaxDuration(v);
              updateSparkPrefs({ maxDuration: v });
            }}
            maxDistance={maxDistance}
            onMaxDistanceChange={(v) => {
              setMaxDistance(v);
              updateSparkPrefs({ maxDistance: v });
            }}
            energyIndex={energyIndex}
            onEnergyIndexChange={(v) => {
              setEnergyIndex(v);
              updateSparkPrefs({ energyIndex: v });
            }}
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
        open={!!schedulingSpark || !!schedulingEvent}
        onOpenChange={(open) => {
          if (!open) {
            setSchedulingSpark(null);
            setSchedulingEvent(null);
          }
        }}
        // Une fois vraiment planifié (pas juste la modale fermée — on
        // annulerait sinon aussi en cliquant "Annuler"), le Spark/événement
        // n'a plus de raison de rester dans "Pour toi, maintenant" — même
        // mécanisme de retrait que le bouton supprimer (dismiss du Spark en
        // base, DELETE de l'événement).
        onSuccess={() => {
          if (schedulingSpark) deleteSpark(schedulingSpark._id);
          if (schedulingEvent) deleteEvent(schedulingEvent);
        }}
        defaultModule="SparkTime"
        defaultTitle={schedulingSpark?.title ?? schedulingEvent?.title}
        defaultNotes={
          schedulingSpark
            ? scheduleNotesFor(schedulingSpark)
            : schedulingEvent
              ? scheduleNotesForEvent(schedulingEvent)
              : ""
        }
        defaultDuration={schedulingSpark?.duration}
        // Date réelle de l'événement — jamais laissée vide pour un
        // événement, sinon la modale ferait suggérer une date par l'IA,
        // ce qui n'a pas de sens pour un événement à date fixe.
        defaultDate={schedulingEvent?.date}
        sparkId={schedulingSpark?._id}
      />
    </div>
  );
}
