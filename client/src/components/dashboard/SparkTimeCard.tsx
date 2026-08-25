import { useEffect, useState } from "react";
import { Plus, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useSparkStore } from "@/store/sparkStore";
import NewActivityModal from "@/components/widgets/NewActivityModal";
import type { ISpark } from "@shared/types";

export default function SparkTimeCard() {
  const sparks = useSparkStore((s) => s.sparks);
  const fetchSparks = useSparkStore((s) => s.fetchSparks);
  const [schedulingItem, setSchedulingItem] = useState<ISpark | null>(null);
  const [session, setSession] = useState(0);

  useEffect(() => {
    fetchSparks();
  }, [fetchSparks]);

  const visibleSparks = sparks.slice(0, 3);

  function handlePlan(item: ISpark) {
    setSession((s) => s + 1);
    setSchedulingItem(item);
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-sparktime">
          <span className="h-1.5 w-1.5 rounded-full bg-sparktime" />
          SparkTime · Pour toi
        </p>
        <Link
          to="/sparktime"
          className="text-[10px] sm:text-xs text-black/70 text-muted-foreground hover:underline"
        >
          Voir tout
        </Link>
      </div>

      {visibleSparks.length === 0 ? (
        <p className="text-xs sm:text-sm text-muted-foreground">
          Génère des Sparks depuis SparkTime pour voir des suggestions ici.
        </p>
      ) : (
        <ul className="space-y-2">
          {visibleSparks.map((s) => (
            <li
              key={s._id}
              className="flex items-center justify-between rounded-xl bg-cream-secondary p-3"
            >
              <div>
                <p className="text-xs sm:text-sm font-medium">{s.title}</p>
                <div className="mt-1 flex justify-start items-center gap-1.5">
                  <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-black/70" />
                  <p className="text-[10px] sm:text-xs font-mono text-black/60 text-muted-foreground">
                    {s.duration} min{s.detail ? ` · ${s.detail}` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handlePlan(s)}
                className="flex h-5.5 w-5.5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-sparktime-bg text-sparktime"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <NewActivityModal
        key={session}
        open={!!schedulingItem}
        onOpenChange={(open) => !open && setSchedulingItem(null)}
        defaultModule="SparkTime"
        defaultTitle={schedulingItem?.title}
        defaultNotes={schedulingItem?.detail}
        defaultDuration={schedulingItem?.duration}
      />
    </div>
  );
}
