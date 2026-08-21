import { useState } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
  type DragEndEvent,
  type DragMoveEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { pointerFirstCollisionDetection } from "@/lib/dndCollision";
import { useDayPlanStore } from "@/store/dayPlanStore";
import type { DayPlanBlock } from "@shared/types";

const START_HOUR = 7;
const END_HOUR = 23;
const HOUR_HEIGHT = 88; // px par heure — 30 min = 44px, assez pour 2 lignes compactes

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getBlockPosition(block: DayPlanBlock) {
  const startMinutes = timeToMinutes(block.time) - START_HOUR * 60;
  const top = (startMinutes / 60) * HOUR_HEIGHT;
  const height = (block.duration / 60) * HOUR_HEIGHT;
  return { top, height }; // jamais de minimum forcé : la hauteur reste toujours fidèle à la vraie durée
}

const moduleBgSoft = {
  FlowDay: "bg-flowday-bg text-flowday",
  MindShelf: "bg-mindshelf-bg text-mindshelf",
  SparkTime: "bg-sparktime-bg text-sparktime",
};

const moduleBgSolid = {
  FlowDay: "bg-flowday text-white",
  MindShelf: "bg-mindshelf text-white",
  SparkTime: "bg-sparktime text-white",
};

interface BlockDropData {
  time: string;
}

// Aperçu en direct de l'échange, cf. WeekGridView pour le détail du calcul
// et pour pourquoi seule la position (jamais la taille) change en aperçu.
interface SwapPreview {
  targetId: string;
  dx: number;
  dy: number;
}

interface DayTimelineViewProps {
  blocks: DayPlanBlock[];
  onDeleteBlock: (blockId: string) => void;
  onEditBlock: (block: DayPlanBlock) => void;
}

export default function DayTimelineView({
  blocks,
  onDeleteBlock,
  onEditBlock,
}: DayTimelineViewProps) {
  const updateBlock = useDayPlanStore((s) => s.updateBlock);
  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i,
  );
  const [swapPreview, setSwapPreview] = useState<SwapPreview | null>(null);

  // Un mouvement de quelques pixels ne déclenche pas de drag — ça laisse le
  // clic simple (ouvrir la modale d'édition) fonctionner normalement.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragMove(event: DragMoveEvent) {
    const { active, over } = event;
    const overData = over?.data.current as BlockDropData | undefined;
    if (!over || !overData || over.id === active.id) {
      setSwapPreview(null);
      return;
    }
    // Une seule mesure par cible survolée — cf. WeekGridView pour le détail
    // (recalculer à chaque tick réutiliserait la position déjà déplacée par
    // notre propre transform d'aperçu, empêchant la cible de rejoindre
    // complètement sa destination).
    setSwapPreview((prev) => {
      if (prev && prev.targetId === over.id) return prev;
      const activeRect = active.rect.current.initial;
      const overRect = over.rect;
      if (!activeRect) return null;
      return {
        targetId: over.id as string,
        dx: activeRect.left - overRect.left,
        dy: activeRect.top - overRect.top,
      };
    });
  }

  // Un seul jour est affiché ici — pas de zone de dépôt "canvas" dédiée
  // (contrairement à la vue Semaine), seuls les blocs eux-mêmes sont des
  // zones de dépôt. Le déplacement libre se base donc toujours sur `delta.y`
  // plutôt que sur `over`, qui reste `null` au-dessus d'un espace vide.
  async function handleDragEnd(event: DragEndEvent) {
    setSwapPreview(null);
    const { active, over, delta } = event;
    const data = active.data.current as {
      blockId: string;
      originalTop: number;
      time: string;
    };

    // Lâché directement sur un autre bloc : les deux échangent leur heure,
    // mais gardent chacun leur propre durée — seule la place dans le
    // planning change. Séquencé par cohérence avec les autres vues, même si
    // une seule journée affichée ici passe toujours par la branche atomique
    // côté serveur.
    const overData = over?.data.current as BlockDropData | undefined;
    if (overData && over && over.id !== active.id) {
      await updateBlock(data.blockId, { time: overData.time });
      await updateBlock(over.id as string, { time: data.time });
      return;
    }

    if (delta.y === 0) return;
    const newTop = data.originalTop + delta.y;
    const rawMinutes = START_HOUR * 60 + (newTop / HOUR_HEIGHT) * 60;
    const snapped = Math.round(rawMinutes / 15) * 15;
    const clamped = Math.max(
      START_HOUR * 60,
      Math.min(END_HOUR * 60 + 45, snapped),
    );
    updateBlock(data.blockId, { time: minutesToTime(clamped) });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerFirstCollisionDetection}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setSwapPreview(null)}
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

          <div className="relative flex-1 border-l border-black/10">
            {hours.map((h) => (
              <div
                key={h}
                style={{ height: HOUR_HEIGHT }}
                className="border-b border-black/5"
              />
            ))}

            {blocks.map((block) => (
              <DraggableBlock
                key={block.id}
                block={block}
                onEditBlock={onEditBlock}
                onDeleteBlock={onDeleteBlock}
                swapPreview={
                  swapPreview?.targetId === block.id ? swapPreview : null
                }
              />
            ))}
          </div>
        </div>
      </div>
    </DndContext>
  );
}

function DraggableBlock({
  block,
  onEditBlock,
  onDeleteBlock,
  swapPreview,
}: {
  block: DayPlanBlock;
  onEditBlock: (block: DayPlanBlock) => void;
  onDeleteBlock: (blockId: string) => void;
  swapPreview: SwapPreview | null;
}) {
  const { top, height } = getBlockPosition(block);
  const isSolid = block.duration > 60;
  const isCompact = height < 44; // moins de 30 min : affichage réduit
  const timeColorClass = isSolid ? "text-white/80" : "text-black/60";

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: block.id,
      data: { blockId: block.id, originalTop: top, time: block.time },
    });
  const { setNodeRef: setDropRef } = useDroppable({
    id: block.id,
    data: { time: block.time } satisfies BlockDropData,
  });

  const previewTransform = swapPreview
    ? `translate3d(${swapPreview.dx}px, ${swapPreview.dy}px, 0)`
    : undefined;

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setDropRef(node);
      }}
      {...listeners}
      {...attributes}
      style={{
        top,
        height,
        transform: transform ? CSS.Translate.toString(transform) : previewTransform,
        transition: previewTransform ? "transform 150ms ease" : undefined,
        touchAction: "none",
      }}
      onClick={() => onEditBlock(block)}
      className={cn(
        "group absolute left-1 right-1 cursor-grab overflow-visible rounded-lg px-2 active:cursor-grabbing",
        isDragging ? "z-20 shadow-lg" : "hover:z-10",
        swapPreview && "z-10 ring-2 ring-white",
        isCompact ? "flex items-center py-0" : "py-1",
        isSolid ? moduleBgSolid[block.module] : moduleBgSoft[block.module],
      )}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDeleteBlock(block.id);
        }}
        className="absolute -right-2 -top-2 z-10 hidden h-5 w-5 items-center justify-center rounded-full border border-black/10 bg-white text-black/40 shadow-sm hover:border-accent-danger/30 hover:text-accent-danger group-hover:flex"
        aria-label="Supprimer ce bloc"
      >
        <X className="h-3 w-3" />
      </button>
      {isCompact ? (
        <p className="truncate text-xs font-medium">
          {block.title}{" "}
          <span className={cn("font-mono font-normal", timeColorClass)}>
            · {block.time}
          </span>
        </p>
      ) : (
        <>
          <p className="truncate text-sm font-medium leading-tight">
            {block.title}
          </p>
          <p className={cn("font-mono text-xs leading-tight", timeColorClass)}>
            {block.time} - {addMinutes(block.time, block.duration)}
          </p>
        </>
      )}
    </div>
  );
}

function addMinutes(time: string, minutes: number): string {
  const total = timeToMinutes(time) + minutes;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
