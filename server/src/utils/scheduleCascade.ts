export interface CascadeBlock {
  id: string;
  time: string;
  duration: number;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Dupliqué depuis client/src/lib/scheduleCascade.ts (même logique, jamais
// importé entre les deux packages — voir la décision "Types Mongoose non
// reliés aux types partagés" dans CLAUDE.md : le serveur n'importe jamais
// shared/, choix pragmatique déjà assumé ailleurs dans ce projet).
//
// Résout un chevauchement par décalage en cascade plutôt que par échange :
// le bloc glissé prend sa nouvelle heure telle quelle, et quiconque le
// chevauche est repoussé du côté opposé à son point d'arrivée (après lui
// s'il arrive avant, avant lui s'il arrive après) — la poussée se propage
// dans la même direction tant qu'un chevauchement subsiste. Chaque bloc
// garde sa propre durée, seule son heure de début change.
export function resolveCascade(
  others: CascadeBlock[],
  draggedDuration: number,
  draggedNewTime: string,
): Record<string, string> {
  const sorted = [...others].sort(
    (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time),
  );
  const updates: Record<string, string> = {};
  const draggedStart = timeToMinutes(draggedNewTime);
  const draggedEnd = draggedStart + draggedDuration;

  // Chevauchement strict, sans seuil de tolérance : cette fonction fait
  // aussi foi pour le résultat final enregistré, elle doit donc garantir
  // qu'aucun chevauchement ne subsiste, même minime. Voir la copie client
  // pour le détail : le seuil "plus tolérant avant de pousser" pour
  // l'aperçu vit uniquement côté client (useCascadePreview), jamais ici.
  const overlapping = sorted.filter((b) => {
    const start = timeToMinutes(b.time);
    const end = start + b.duration;
    return start < draggedEnd && end > draggedStart;
  });
  if (overlapping.length === 0) return updates;

  const laterGroup = overlapping.filter(
    (b) => timeToMinutes(b.time) >= draggedStart,
  );
  if (laterGroup.length > 0) {
    const startIdx = sorted.indexOf(laterGroup[0]);
    let cursorEnd = draggedEnd;
    for (let i = startIdx; i < sorted.length; i++) {
      const block = sorted[i];
      const start = timeToMinutes(block.time);
      if (start >= cursorEnd) break;
      const newStart = cursorEnd;
      updates[block.id] = minutesToTime(newStart);
      cursorEnd = newStart + block.duration;
    }
  }

  const earlierGroup = overlapping.filter(
    (b) => timeToMinutes(b.time) < draggedStart,
  );
  if (earlierGroup.length > 0) {
    const startIdx = sorted.indexOf(earlierGroup[earlierGroup.length - 1]);
    let cursorStart = draggedStart;
    for (let i = startIdx; i >= 0; i--) {
      const block = sorted[i];
      const end = timeToMinutes(block.time) + block.duration;
      if (end <= cursorStart) break;
      const newStart = cursorStart - block.duration;
      updates[block.id] = minutesToTime(newStart);
      cursorStart = newStart;
    }
  }

  return updates;
}
