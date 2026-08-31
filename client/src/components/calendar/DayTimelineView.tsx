import { useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragMoveEvent,
} from "@dnd-kit/core";
import { useDragSensors } from "@/hooks/useDragSensors";
import { useCascadePreview } from "@/hooks/useCascadePreview";
import { useDayPlanStore } from "@/store/dayPlanStore";
import { timeToMinutes, minutesToTime } from "@/lib/dateUtils";
import DraggableBlock, { BlockVisual } from "./DraggableBlock";
import type { DayPlanBlock } from "@shared/types";

const START_HOUR = 7;
const END_HOUR = 23;
const HOUR_HEIGHT = 88; // px par heure — 30 min = 44px, assez pour 2 lignes compactes

function getBlockPosition(block: DayPlanBlock) {
  const startMinutes = timeToMinutes(block.time) - START_HOUR * 60;
  const top = (startMinutes / 60) * HOUR_HEIGHT;
  const height = (block.duration / 60) * HOUR_HEIGHT;
  return { top, height }; // jamais de minimum forcé : la hauteur reste toujours fidèle à la vraie durée
}

// Position verticale -> heure, avec calage sur 15 min et bornage à la plage
// affichée (07:00-23:45) — utilisé aussi bien pour l'aperçu en direct que
// pour le résultat final au lâcher.
function computeSnappedTime(originalTop: number, deltaY: number): string {
  const newTop = originalTop + deltaY;
  const rawMinutes = START_HOUR * 60 + (newTop / HOUR_HEIGHT) * 60;
  const snapped = Math.round(rawMinutes / 15) * 15;
  const clamped = Math.max(
    START_HOUR * 60,
    Math.min(END_HOUR * 60 + 45, snapped),
  );
  return minutesToTime(clamped);
}

interface DayTimelineViewProps {
  date: string;
  blocks: DayPlanBlock[];
  onDeleteBlock: (blockId: string) => void;
  onEditBlock: (block: DayPlanBlock) => void;
}

export default function DayTimelineView({
  date,
  blocks,
  onDeleteBlock,
  onEditBlock,
}: DayTimelineViewProps) {
  const reflowBlock = useDayPlanStore((s) => s.reflowBlock);
  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i,
  );
  const sensors = useDragSensors();
  const { preview, update, reset } = useCascadePreview(HOUR_HEIGHT);
  const [activeDrag, setActiveDrag] = useState<{
    block: DayPlanBlock;
    width: number;
  } | null>(null);
  const columnRef = useRef<HTMLDivElement>(null);

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as { blockId: string };
    const block = blocks.find((b) => b.id === data.blockId);
    if (!block) return;
    // Largeur capturée une seule fois sur la colonne elle-même (jamais
    // redimensionnée pendant un drag) plutôt que sur le nœud glissé mesuré
    // en direct par dnd-kit — cette dernière s'était avérée instable
    // (le clone se retrouvait rétréci par moments pendant le survol).
    setActiveDrag({
      block,
      width: columnRef.current?.getBoundingClientRect().width ?? 0,
    });
  }

  // Un seul jour est affiché ici — pas de zone de dépôt "canvas" dédiée
  // (contrairement à la vue Semaine) : le déplacement se base uniquement sur
  // `delta.y`. Un chevauchement éventuel avec un autre bloc n'est plus géré
  // par un cas spécial "lâché sur un bloc" — la cascade s'en charge dans
  // tous les cas, qu'on lâche précisément sur un bloc ou pas.
  function handleDragMove(event: DragMoveEvent) {
    const { active, delta } = event;
    const data = active.data.current as {
      blockId: string;
      originalTop: number;
    };
    const dragged = blocks.find((b) => b.id === data.blockId);
    if (!dragged) return;
    const newTime = computeSnappedTime(data.originalTop, delta.y);
    const others = blocks
      .filter((b) => b.id !== data.blockId)
      .map((b) => ({ id: b.id, time: b.time, duration: b.duration }));
    update(others, dragged.duration, newTime);
  }

  function handleDragEnd(event: DragEndEvent) {
    reset();
    setActiveDrag(null);
    const { active, delta } = event;
    const data = active.data.current as {
      blockId: string;
      originalTop: number;
      time: string;
    };
    if (delta.y === 0) return;

    const block = blocks.find((b) => b.id === data.blockId);
    if (!block) return;
    const newTime = computeSnappedTime(data.originalTop, delta.y);
    if (newTime === data.time) return;

    reflowBlock({ block, targetDate: date, newTime });
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        reset();
        setActiveDrag(null);
      }}
    >
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="relative flex">
          <div className="w-16 shrink-0">
            {hours.map((h) => (
              <div key={h} style={{ height: HOUR_HEIGHT }} className="relative">
                <span className="absolute -top-2 font-mono text-xs text-black/60 text-muted-foreground">
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          <div
            ref={columnRef}
            className="relative flex-1 border-l border-black/10"
          >
            {hours.map((h) => (
              <div
                key={h}
                style={{ height: HOUR_HEIGHT }}
                className="border-b border-black/5"
              />
            ))}

            {blocks.map((block) => {
              const { top, height } = getBlockPosition(block);
              return (
                <DraggableBlock
                  key={block.id}
                  block={block}
                  top={top}
                  height={height}
                  onEditBlock={onEditBlock}
                  onDeleteBlock={onDeleteBlock}
                  previewOffsetY={preview.get(block.id) ?? null}
                />
              );
            })}
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeDrag && (
          <DayOverlayBlock block={activeDrag.block} width={activeDrag.width} />
        )}
      </DragOverlay>
    </DndContext>
  );
}

// Clone flottant du bloc glissé. La hauteur se calcule directement depuis
// sa durée (la même formule que pour le vrai bloc, `getBlockPosition`) —
// aucune mesure nécessaire, donc aucun risque de flou/rétrécissement
// pendant le survol. La largeur, elle, est capturée une seule fois sur la
// colonne au démarrage du drag (voir `columnRef` ci-dessus) plutôt que sur
// le nœud glissé mesuré en direct par dnd-kit (`activeNodeRect`), qui
// s'était avéré instable — le clone se retrouvait rétréci par moments
// pendant le glisser, avant de reprendre sa taille au lâcher.
function DayOverlayBlock({
  block,
  width,
}: {
  block: DayPlanBlock;
  width: number;
}) {
  const { height } = getBlockPosition(block);
  return (
    <div style={{ width, height }} className="shadow-xl">
      <BlockVisual block={block} height={height} />
    </div>
  );
}
