import { useState } from "react";
import { Compass } from "lucide-react";
import type { IInterest } from "@shared/types";

interface InterestsPanelProps {
  interests: IInterest[];
}

const VISIBLE_COUNT = 6;

export default function InterestsPanel({ interests }: InterestsPanelProps) {
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? interests : interests.slice(0, VISIBLE_COUNT);
  const remaining = interests.length - visible.length;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide">
          <Compass className="h-4.5 w-4.5 text-sparktime" />
          Centres d'intérêt
        </h2>
        {interests.length > VISIBLE_COUNT && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-xs text-black/60 text-muted-foreground hover:underline cursor-pointer"
          >
            {showAll ? "Réduire" : "Tout voir →"}
          </button>
        )}
      </div>

      {interests.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun centre d'intérêt pour l'instant.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {visible.map((i) => (
              <span
                key={i._id}
                className="rounded-full bg-sparktime-bg px-3 py-1 text-xs font-medium text-sparktime"
              >
                {i.emoji} {i.name}
              </span>
            ))}
            {!showAll && remaining > 0 && (
              <button
                onClick={() => setShowAll(true)}
                className="rounded-full bg-cream-secondary px-3 py-1 text-xs font-medium text-black/60 hover:bg-black/5 cursor-pointer"
              >
                + {remaining} de plus
              </button>
            )}
          </div>
          <p className="mt-4 text-xs text-black/50 text-muted-foreground">
            {interests.length > 1
              ? `${interests.length} thèmes actifs — ils nourrissent tes suggestions du moment.`
              : "1 thème actif — il nourrit tes suggestions du moment."}
          </p>
        </>
      )}
    </div>
  );
}
