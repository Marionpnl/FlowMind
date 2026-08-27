import { useSensor, useSensors, PointerSensor } from "@dnd-kit/core";

// Un mouvement de quelques pixels ne déclenche pas de drag — Partagé par les 3 vues
// Calendrier + TodayPlanning pour garantir un comportement identique partout plutôt que 4 copies
export function useDragSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
}
