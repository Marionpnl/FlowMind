import { SlidersHorizontal } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  ENERGY_LEVELS,
  MAX_DISTANCE_SLIDER_VALUE,
  distanceLabel,
} from "@/lib/sparktime";

const sliderColorClass = cn(
  "[&_[data-slot=slider-track]]:bg-black/10",
  "[&_[data-slot=slider-range]]:bg-sparktime",
  "[&_[data-slot=slider-thumb]]:border-sparktime",
);

interface AdjustSuggestionsPanelProps {
  maxDuration: number;
  onMaxDurationChange: (value: number) => void;
  maxDistance: number;
  onMaxDistanceChange: (value: number) => void;
  energyIndex: number;
  onEnergyIndexChange: (value: number) => void;
}

export default function AdjustSuggestionsPanel({
  maxDuration,
  onMaxDurationChange,
  maxDistance,
  onMaxDistanceChange,
  energyIndex,
  onEnergyIndexChange,
}: AdjustSuggestionsPanelProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wide">
        <SlidersHorizontal className="h-4.5 w-4.5 text-sparktime" />
        Ajuster les suggestions
      </h2>

      <div className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-black/60 text-muted-foreground">
            <span className="uppercase tracking-widest">Durée max</span>
            <span className="font-mono">{maxDuration} min</span>
          </div>
          <Slider
            className={sliderColorClass}
            value={[maxDuration]}
            min={15}
            max={120}
            step={15}
            onValueChange={(v) =>
              onMaxDurationChange(Array.isArray(v) ? v[0] : v)
            }
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-black/60 text-muted-foreground">
            <span className="uppercase tracking-widest">Distance max</span>
            <span className="font-mono">{distanceLabel(maxDistance)}</span>
          </div>
          <Slider
            className={sliderColorClass}
            value={[maxDistance]}
            min={1}
            max={MAX_DISTANCE_SLIDER_VALUE}
            step={1}
            onValueChange={(v) =>
              onMaxDistanceChange(Array.isArray(v) ? v[0] : v)
            }
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-black/60 text-muted-foreground">
            <span className="uppercase tracking-widest">Énergie requise</span>
            <span>{ENERGY_LEVELS[energyIndex]}</span>
          </div>
          <Slider
            className={sliderColorClass}
            value={[energyIndex]}
            min={0}
            max={ENERGY_LEVELS.length - 1}
            step={1}
            onValueChange={(v) =>
              onEnergyIndexChange(Array.isArray(v) ? v[0] : v)
            }
          />
        </div>
      </div>
    </div>
  );
}
