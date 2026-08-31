import { useRef, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragMoveEvent,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import {
  DAY_LABELS,
  getWeekDays,
  toDateString,
  timeToMinutes,
  minutesToTime,
} from "@/lib/dateUtils";
import { pointerFirstCollisionDetection } from "@/lib/dndCollision";
import { useDragSensors } from "@/hooks/useDragSensors";
import { useCascadePreview } from "@/hooks/useCascadePreview";
import { useDayPlanStore } from "@/store/dayPlanStore";
import DraggableBlock, { BlockVisual } from "./DraggableBlock";
import type { DayPlanBlock, IDayPlan } from "@shared/types";

const START_HOUR = 7;
const END_HOUR = 23;
const HOUR_HEIGHT = 60;

function getBlockPosition(block: DayPlanBlock) {
  const startMinutes = timeToMinutes(block.time) - START_HOUR * 60;
  const top = (startMinutes / 60) * HOUR_HEIGHT;
  const height = (block.duration / 60) * HOUR_HEIGHT;
  return { top, height };
}

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

interface WeekGridViewProps {
  weekStart: Date;
  plans: IDayPlan[];
  onDeleteBlock: (blockId: string) => void;
  onEditBlock: (block: DayPlanBlock, date: string) => void;
}

export default function WeekGridView({
  weekStart,
  plans,
  onDeleteBlock,
  onEditBlock,
}: WeekGridViewProps) {
  const reflowBlock = useDayPlanStore((s) => s.reflowBlock);
  const days = getWeekDays(weekStart);
  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i,
  );
  const planByDate = new Map(plans.map((p) => [p.date, p]));
  const today = toDateString(new Date());
  const sensors = useDragSensors();
  const { preview, update, reset } = useCascadePreview(HOUR_HEIGHT);
  const [activeDrag, setActiveDrag] = useState<{
    block: DayPlanBlock;
    width: number;
  } | null>(null);
  // Une colonne par jour, toutes de largeur identique (grille CSS) — on
  // retrouve celle du jour d'origine pour mesurer sa largeur une seule fois
  // au démarrage du drag, plutôt que de mesurer le nœud glissé en direct
  // via dnd-kit (`activeNodeRect`), qui s'était avéré instable (le clone
  // se retrouvait rétréci par moments pendant le survol).
  const columnRefs = useRef(new Map<string, HTMLDivElement>());

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as { blockId: string; date: string };
    const sourcePlan = planByDate.get(data.date);
    const block = sourcePlan?.blocks.find((b) => b.id === data.blockId);
    if (!block) return;
    const width =
      columnRefs.current.get(data.date)?.getBoundingClientRect().width ?? 0;
    setActiveDrag({ block, width });
  }

  // Le jour cible vient du bloc survolé s'il y en a un (il porte sa propre
  // date), sinon de l'id de la zone de dépôt elle-même (une colonne vide).
  // L'heure cible vient toujours de la position verticale du pointeur — un
  // chevauchement éventuel avec le bloc survolé est résolu par la cascade,
  // plus par un échange direct.
  function resolveTarget(
    event: DragMoveEvent | DragEndEvent,
  ): { targetDate: string; newTime: string } | null {
    const { active, over, delta } = event;
    if (!over) return null;
    const data = active.data.current as { originalTop: number };
    const overData = over.data.current as { date: string } | undefined;
    const targetDate = overData ? overData.date : (over.id as string);
    return { targetDate, newTime: computeSnappedTime(data.originalTop, delta.y) };
  }

  function handleDragMove(event: DragMoveEvent) {
    const target = resolveTarget(event);
    const data = event.active.data.current as { blockId: string; date: string };
    if (!target) {
      reset();
      return;
    }
    const sourcePlan = planByDate.get(data.date);
    const dragged = sourcePlan?.blocks.find((b) => b.id === data.blockId);
    if (!dragged) return;

    const targetPlan = planByDate.get(target.targetDate);
    const others = (targetPlan?.blocks ?? [])
      .filter((b) => b.id !== data.blockId)
      .map((b) => ({ id: b.id, time: b.time, duration: b.duration }));
    update(others, dragged.duration, target.newTime);
  }

  function handleDragEnd(event: DragEndEvent) {
    reset();
    setActiveDrag(null);
    const target = resolveTarget(event);
    if (!target) return;
    const data = event.active.data.current as {
      blockId: string;
      date: string;
      time: string;
    };
    if (target.targetDate === data.date && target.newTime === data.time) return;

    const sourcePlan = planByDate.get(data.date);
    const block = sourcePlan?.blocks.find((b) => b.id === data.blockId);
    if (!block) return;

    reflowBlock({
      block,
      targetDate: target.targetDate,
      newTime: target.newTime,
      sourceDate: target.targetDate !== data.date ? data.date : undefined,
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerFirstCollisionDetection}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        reset();
        setActiveDrag(null);
      }}
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {/* En-têtes des jours */}
        <div className="grid grid-cols-[36px_repeat(7,1fr)] border-b border-black/5 sm:grid-cols-[64px_repeat(7,1fr)]">
          <div />
          {days.map((day, i) => {
            const isToday = toDateString(day) === today;
            return (
              <div
                key={i}
                className="border-l border-black/5 px-1 py-2 sm:px-3 sm:py-3"
              >
                <p className="text-[9px] text-black/60 font-medium uppercase tracking-widest text-muted-foreground sm:text-xs">
                  {DAY_LABELS[i]}
                </p>
                <p
                  className={cn(
                    "mt-1 w-fit rounded-full px-1.5 py-0.5 font-mono text-xs tracking-widest font-medium text-black/70 sm:text-sm",
                    isToday && "bg-flowday-bg text-black/70",
                  )}
                >
                  {day.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Grille horaire */}
        <div className="grid grid-cols-[36px_repeat(7,1fr)] sm:grid-cols-[64px_repeat(7,1fr)]">
          {/* Colonne des heures — mêmes bordures que les colonnes de jours pour un alignement parfait */}
          <div>
            {hours.map((h, idx) => (
              <div
                key={h}
                style={{ height: HOUR_HEIGHT }}
                className={cn(
                  "px-1 pt-1 sm:px-2",
                  idx !== 0 && "border-t border-black/5",
                )}
              >
                <span className="font-mono text-[10px] text-black/60 text-muted-foreground sm:text-xs">
                  <span className="sm:hidden">
                    {String(h).padStart(2, "0")}h
                  </span>
                  <span className="hidden sm:inline">
                    {String(h).padStart(2, "0")}:00
                  </span>
                </span>
              </div>
            ))}
          </div>

          {/* Colonnes des jours */}
          {days.map((day, dayIdx) => {
            const dateStr = toDateString(day);
            const plan = planByDate.get(dateStr);
            const blocks = plan?.blocks ?? [];

            return (
              <DayColumn
                key={dayIdx}
                dateStr={dateStr}
                registerRef={(node) => {
                  if (node) columnRefs.current.set(dateStr, node);
                  else columnRefs.current.delete(dateStr);
                }}
              >
                {hours.map((h, idx) => (
                  <div
                    key={h}
                    style={{ height: HOUR_HEIGHT }}
                    className={cn(idx !== 0 && "border-t border-black/5")}
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
                      dateStr={dateStr}
                      dense
                      onEditBlock={(b, d) => onEditBlock(b, d as string)}
                      onDeleteBlock={onDeleteBlock}
                      previewOffsetY={preview.get(block.id) ?? null}
                    />
                  );
                })}
              </DayColumn>
            );
          })}
        </div>
      </div>
      <DragOverlay>
        {activeDrag && <WeekOverlayBlock block={activeDrag.block} width={activeDrag.width} />}
      </DragOverlay>
    </DndContext>
  );
}

// Clone flottant du bloc glissé. La hauteur se calcule directement depuis
// sa durée (la même formule que pour le vrai bloc, `getBlockPosition`) —
// aucune mesure nécessaire. La largeur est capturée une seule fois sur la
// colonne du jour d'origine au démarrage du drag (voir `columnRefs`
// ci-dessus) plutôt que sur le nœud glissé mesuré en direct par dnd-kit
// (`activeNodeRect`), qui s'était avéré instable — le clone se retrouvait
// rétréci par moments pendant le survol, avant de reprendre sa taille au
// lâcher.
function WeekOverlayBlock({ block, width }: { block: DayPlanBlock; width: number }) {
  const { height } = getBlockPosition(block);
  return (
    <div style={{ width, height }} className="shadow-xl">
      <BlockVisual block={block} height={height} dense />
    </div>
  );
}

function DayColumn({
  dateStr,
  registerRef,
  children,
}: {
  dateStr: string;
  registerRef: (node: HTMLDivElement | null) => void;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dateStr });
  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        registerRef(node);
      }}
      className={cn(
        "relative border-l border-black/5 transition-colors",
        isOver && "bg-flowday/5",
      )}
    >
      {children}
    </div>
  );
}
