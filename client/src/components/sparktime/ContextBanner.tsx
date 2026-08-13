import { MapPin, Sun, Clock, Zap } from "lucide-react";

export default function ContextBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <span className="absolute inset-x-0 top-0 h-0.5 bg-sparktime" />
      <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-sparktime">
        <span className="h-1.5 w-1.5 rounded-full bg-sparktime" />
        Ton contexte · Maintenant
      </p>
      <p className="font-display text-xl italic leading-snug">
        Il te reste <span className="font-semibold not-italic">2 h 30</span>{" "}
        avant ta prochaine activité, l'énergie est moyenne et il fait beau
        dehors.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-cream-secondary px-3 py-1.5 font-mono text-xs text-black/60">
          <MapPin className="h-3 w-3 mr-1" />
          Yverdon-les-Bains
        </span>
        <span className="flex items-center gap-1 rounded-full bg-cream-secondary px-3 py-1.5 text-xs font-mono text-black/60">
          <Sun className="h-3 w-3 mr-1" />
          22°C · ensoleillé
        </span>
        <span className="flex items-center gap-1 rounded-full bg-cream-secondary px-3 py-1.5 font-mono text-xs text-black/60">
          <Clock className="h-3 w-3 mr-1" />
          15:30
        </span>
        <span className="flex items-center gap-1 rounded-full bg-sparktime-bg px-3 py-1.5 font-mono text-xs text-sparktime">
          <Zap className="h-3 w-3 mr-1" />
          Énergie moyenne
        </span>
      </div>
    </div>
  );
}
