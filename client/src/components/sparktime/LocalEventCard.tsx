import type { ILocalEvent } from "@shared/types";
import { Button } from "@/components/ui/button";

interface LocalEventCardProps {
  event: ILocalEvent;
  onPlan: () => void;
}

// Même carcasse visuelle que SparkCard.tsx pour que les deux types de carte
// se fondent dans la même grille — contenu différent : date réelle plutôt
// que durée, lieu plutôt que description, et un lien externe vers la fiche
// Ticketmaster plutôt qu'une modale "Détails" (elle fait déjà office de
// détail, même logique que "Voir sur Google Books").
export default function LocalEventCard({ event, onPlan }: LocalEventCardProps) {
  const dateLabel = new Date(event.date).toLocaleDateString("fr-CH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const category = event.genre || event.segment;

  return (
    <div className="group relative rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-cream-secondary px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-black/50 text-muted-foreground">
            Événement
          </span>
          {category && (
            <span className="rounded-full bg-sparktime-bg px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-sparktime">
              {category}
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] text-black/60 text-muted-foreground">
          {dateLabel}
        </span>
      </div>

      <p className="text-md font-medium">{event.title}</p>
      {(event.venue || event.city) && (
        <p className="mt-1 text-xs text-black/50 text-muted-foreground">
          {[event.venue, event.city].filter(Boolean).join(" · ")}
        </p>
      )}

      <div className="mt-4 flex items-center gap-4">
        <Button
          size="sm"
          onClick={onPlan}
          className="bg-[#2B2A28] text-white font-normal text-xs rounded-2xl hover:bg-[#2B2A28]/90 cursor-pointer"
        >
          + Planifier
        </Button>
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-black/60 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          Voir l'événement →
        </a>
      </div>
    </div>
  );
}
