import { useState, type ReactNode } from "react";
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
import { DAY_LABELS, getMonthGrid, toDateString } from "@/lib/dateUtils";
import { pointerFirstCollisionDetection } from "@/lib/dndCollision";
import { useLongPress } from "@/lib/useLongPress";
import { useDayPlanStore } from "@/store/dayPlanStore";
import type { DayPlanBlock, IDayPlan } from "@shared/types";

const moduleBgSoft = {
  FlowDay: "bg-flowday-bg text-flowday",
  MindShelf: "bg-mindshelf-bg text-mindshelf",
  SparkTime: "bg-sparktime-bg text-sparktime",
};

interface BlockDropData {
  date: string;
}

// Aperçu en direct de l'échange, cf. WeekGridView pour le détail du calcul.
// Pas de `height` ici : les chips du mois n'ont pas d'axe horaire, leur
// taille ne dépend pas d'une durée à faire tenir.
interface SwapPreview {
  targetId: string;
  dx: number;
  dy: number;
}

interface MonthGridViewProps {
  year: number;
  month: number; // 1-12
  plans: IDayPlan[];
  onDeleteBlock: (blockId: string) => void;
  onEditBlock: (block: DayPlanBlock, date: string) => void;
}

export default function MonthGridView({
  year,
  month,
  plans,
  onDeleteBlock,
  onEditBlock,
}: MonthGridViewProps) {
  const updateBlock = useDayPlanStore((s) => s.updateBlock);
  const reorderDayBlocks = useDayPlanStore((s) => s.reorderDayBlocks);
  const grid = getMonthGrid(year, month);
  const planByDate = new Map(plans.map((p) => [p.date, p]));
  const today = toDateString(new Date());
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

  async function handleDragEnd(event: DragEndEvent) {
    setSwapPreview(null);
    const { active, over } = event;
    if (!over) return;
    const data = active.data.current as { blockId: string; date: string };

    const overData = over.data.current as BlockDropData | undefined;
    if (overData && over.id !== active.id) {
      if (overData.date === data.date) {
        // Même jour : rien à échanger côté date, on réordonne plutôt les
        // deux blocs au sein du jour
        const plan = planByDate.get(data.date);
        if (!plan) return;
        const idxActive = plan.blocks.findIndex((b) => b.id === data.blockId);
        const idxOver = plan.blocks.findIndex((b) => b.id === over.id);
        if (idxActive === -1 || idxOver === -1) return;
        const reordered = [...plan.blocks];
        [reordered[idxActive], reordered[idxOver]] = [
          reordered[idxOver],
          reordered[idxActive],
        ];
        await reorderDayBlocks(plan._id, reordered);
        return;
      }
      await updateBlock(data.blockId, { date: overData.date });
      await updateBlock(over.id as string, { date: data.date });
      return;
    }

    const newDate = over.id as string;
    if (newDate === data.date) return;
    updateBlock(data.blockId, { date: newDate });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerFirstCollisionDetection}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setSwapPreview(null)}
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-black/5">
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-1 py-1.5 text-[9px] text-black/70 font-medium uppercase tracking-widest text-muted-foreground sm:px-3 sm:py-2 sm:text-xs"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {grid.map((day, idx) => {
            if (!day) {
              return (
                <div
                  key={idx}
                  className="min-h-16 border-b border-l border-black/5 sm:min-h-28"
                />
              );
            }

            const dateStr = toDateString(day);
            const plan = planByDate.get(dateStr);
            const blocks = plan?.blocks ?? [];
            const isToday = dateStr === today;

            return (
              <DayCell key={idx} dateStr={dateStr}>
                <p
                  className={cn(
                    "text-[10px] text-black/60 font-medium tracking-widest sm:text-xs",
                    isToday &&
                      "flex h-4 w-4 items-center justify-center rounded-full bg-flowday-bg text-black/70 sm:h-5 sm:w-5",
                  )}
                >
                  {day.getDate()}
                </p>
                {blocks.slice(0, 3).map((block) => (
                  <DraggableChip
                    key={block.id}
                    block={block}
                    dateStr={dateStr}
                    onEditBlock={onEditBlock}
                    onDeleteBlock={onDeleteBlock}
                    swapPreview={
                      swapPreview?.targetId === block.id ? swapPreview : null
                    }
                  />
                ))}
                {blocks.length > 3 && (
                  <p className="text-[8px] text-muted-foreground sm:text-[10px]">
                    +{blocks.length - 3} de plus
                  </p>
                )}
              </DayCell>
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}

function DayCell({
  dateStr,
  children,
}: {
  dateStr: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dateStr });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-16 space-y-1 border-b border-l border-black/5 p-1 transition-colors sm:min-h-28 sm:p-3.5",
        isOver && "bg-flowday/5",
      )}
    >
      {children}
    </div>
  );
}

function DraggableChip({
  block,
  dateStr,
  onEditBlock,
  onDeleteBlock,
  swapPreview,
}: {
  block: DayPlanBlock;
  dateStr: string;
  onEditBlock: (block: DayPlanBlock, date: string) => void;
  onDeleteBlock: (blockId: string) => void;
  swapPreview: SwapPreview | null;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: block.id,
      data: { blockId: block.id, date: dateStr },
    });
  const { setNodeRef: setDropRef } = useDroppable({
    id: block.id,
    data: { date: dateStr } satisfies BlockDropData,
  });
  const [setLongPressRef, longPressRevealed, longPressTouchHandlers] =
    useLongPress<HTMLDivElement>();

  const previewTransform = swapPreview
    ? `translate3d(${swapPreview.dx}px, ${swapPreview.dy}px, 0)`
    : undefined;

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setDropRef(node);
        setLongPressRef(node);
      }}
      {...listeners}
      {...attributes}
      {...longPressTouchHandlers}
      style={{
        transform: transform
          ? CSS.Translate.toString(transform)
          : previewTransform,
        transition: previewTransform ? "transform 150ms ease" : undefined,
        touchAction: "none",
      }}
      onClick={() => onEditBlock(block, dateStr)}
      className={cn(
        "group relative cursor-grab rounded px-1 py-0.5 text-[8px] font-medium active:cursor-grabbing sm:px-1.5 sm:text-[10px]",
        isDragging ? "z-20 shadow-md" : "hover:z-10",
        swapPreview && "z-10 ring-2 ring-white",
        moduleBgSoft[block.module],
      )}
    >
      <span className="block truncate">{block.title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDeleteBlock(block.id);
        }}
        className={cn(
          "absolute -right-1.5 -top-1.5 z-10 hidden h-4 w-4 items-center justify-center rounded-full border border-black/10 bg-white text-black/40 shadow-sm hover:border-accent-danger/30 hover:text-accent-danger group-hover:flex",
          longPressRevealed && "flex",
        )}
        aria-label="Supprimer ce bloc"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}
