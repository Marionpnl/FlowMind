import { useState } from "react";
import { resolveCascade, type CascadeBlock } from "@/lib/scheduleCascade";
import { timeToMinutes } from "@/lib/dateUtils";

export type CascadePreview = Map<string, number>; // blockId -> dy en pixels

// Calcule si le bloc glissé a dépassé le milieu du bloc chevauché, pas juste touché son bord.
// Ce seuil ne vit QUE dans l'aperçu — resolveCascade lui-même (utilisé pour le résultat
// réellement enregistré au lâcher) reste un chevauchement strict, sans quoi
// deux blocs pourraient rester réellement superposés dans les données si le
// lâcher tombe pile dans cette zone de tolérance.
function hasCrossedMidpoint(
  others: CascadeBlock[],
  draggedDuration: number,
  newTime: string,
): boolean {
  const draggedStart = timeToMinutes(newTime);
  const draggedEnd = draggedStart + draggedDuration;
  return others.some((b) => {
    const start = timeToMinutes(b.time);
    const center = start + b.duration / 2;
    if (start < draggedStart) return draggedStart < center;
    return draggedEnd > center;
  });
}

// Aperçu en direct pendant le survol : chaque vue calcule à chaque `onDragMove`,
// l'heure d'arrivée envisagée pour le bloc glissé puis appelle `update` avec les autres
// blocs du jour cible et la durée du bloc glissé. Le hook se contente de
// relancer la même cascade que celle appliquée au lâcher et de convertir
// chaque décalage en pixels via `hourHeight`, pour que l'aperçu reste
// fidèle au résultat final même sur une chaîne de plusieurs blocs.
export function useCascadePreview(hourHeight: number) {
  const [preview, setPreview] = useState<CascadePreview>(new Map());

  function update(
    others: CascadeBlock[],
    draggedDuration: number,
    newTime: string | null,
  ) {
    if (
      newTime === null ||
      !hasCrossedMidpoint(others, draggedDuration, newTime)
    ) {
      setPreview(new Map());
      return;
    }
    const updates = resolveCascade(others, draggedDuration, newTime);
    const next = new Map<string, number>();
    for (const [blockId, newBlockTime] of Object.entries(updates)) {
      const original = others.find((b) => b.id === blockId);
      if (!original) continue;
      const deltaMinutes =
        timeToMinutes(newBlockTime) - timeToMinutes(original.time);
      next.set(blockId, (deltaMinutes / 60) * hourHeight);
    }
    setPreview(next);
  }

  return { preview, update, reset: () => setPreview(new Map()) };
}
