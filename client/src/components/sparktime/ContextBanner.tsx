import { MapPin, Sun, Clock, Zap } from "lucide-react";
import { formatDuration } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

interface ContextBannerProps {
  location?: string;
  energyLabel: string;
  nextActivityMinutes: number | null;
  weather: { temperature: number; condition: string } | null;
}

export default function ContextBanner({
  location,
  energyLabel,
  nextActivityMinutes,
  weather,
}: ContextBannerProps) {
  const now = new Date();
  const timeLabel = now.toLocaleTimeString("fr-CH", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <span className="absolute inset-x-0 top-0 h-0.5 bg-sparktime" />
      <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-sparktime">
        <span className="h-1.5 w-1.5 rounded-full bg-sparktime" />
        Ton contexte · Maintenant
      </p>
      <p className="font-display text-xl italic leading-snug">
        {nextActivityMinutes !== null ? (
          <>
            Il te reste{" "}
            <span className="font-semibold not-italic">
              {formatDuration(nextActivityMinutes)}
            </span>{" "}
            avant ta prochaine activité.
          </>
        ) : (
          "Rien de prévu pour l'instant — profite du temps libre."
        )}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-cream-secondary px-3 py-1.5 font-mono text-xs text-black/60">
          <MapPin className="h-3 w-3 mr-1" />
          {location || "Position non renseignée"}
        </span>
        <span
          className={cn(
            "flex items-center gap-1 rounded-full bg-cream-secondary px-3 py-1.5 text-xs font-mono",
            weather ? "text-black/60" : "text-black/40",
          )}
        >
          <Sun className="h-3 w-3 mr-1" />
          {weather
            ? `${weather.temperature}°C · ${weather.condition}`
            : "Météo bientôt disponible"}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-cream-secondary px-3 py-1.5 font-mono text-xs text-black/60">
          <Clock className="h-3 w-3 mr-1" />
          {timeLabel}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-sparktime-bg px-3 py-1.5 font-mono text-xs text-sparktime">
          <Zap className="h-3 w-3 mr-1" />
          Énergie : {energyLabel}
        </span>
      </div>
    </div>
  );
}
