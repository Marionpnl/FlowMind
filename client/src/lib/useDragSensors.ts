import { useSensor, useSensors, MouseSensor, TouchSensor } from "@dnd-kit/core";

// Deux capteurs séparés (plutôt qu'un seul PointerSensor) : la souris et le
// tactile ont besoin de règles différentes. MouseSensor n'écoute que
// `mousedown`, TouchSensor que `touchstart` — aucun conflit entre les deux,
// contrairement à PointerSensor qui réagit aux deux à la fois.
//
// Souris : un simple mouvement de quelques pixels suffit (distance), pas
// besoin d'attendre — la souris ne sert jamais à faire défiler la page.
//
// Tactile : il ne déclenche le glisser que si le doigt reste posé sans bouger.
//
// Partagé par les 3 vues Calendrier + TodayPlanning pour garantir un
// comportement identique partout plutôt que 4 copies.
export function useDragSensors() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );
}
