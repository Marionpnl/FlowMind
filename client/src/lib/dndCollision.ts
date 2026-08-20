import { pointerWithin, rectIntersection, type CollisionDetection } from "@dnd-kit/core";

// Priorité au pointeur : avec l'intersection de rectangles seule (comportement
// par défaut de dnd-kit), un gros bloc glissé peut chevaucher plusieurs zones
// de dépôt à la fois et en désigner une qui n'est pas vraiment sous le
// curseur. On se rabat sur l'intersection de rectangles seulement si rien
// n'est directement sous le pointeur (ex. entre deux blocs).
export const pointerFirstCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length === 0) return rectIntersection(args);

  // Un bloc est toujours imbriqué dans sa colonne/cellule de jour, donc le
  // pointeur touche les deux zones de dépôt en même temps — dnd-kit ne les
  // départage pas par taille, juste par ordre d'enregistrement, ce qui
  // favorisait systématiquement la colonne (plus large) sur le bloc
  // (plus précis). On préfère explicitement les zones "bloc", identifiables
  // par la présence de données passées à `useDroppable` (les colonnes/
  // cellules n'en portent pas).
  const blockCollisions = pointerCollisions.filter(
    (c) => c.data?.droppableContainer.data.current !== undefined,
  );
  return blockCollisions.length > 0 ? blockCollisions : pointerCollisions;
};
