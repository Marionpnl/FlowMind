import { useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DAY_LABELS,
  getMonthGrid,
  toDateString,
  timeToMinutes,
  addMinutesToTime,
} from "@/lib/dateUtils";
import { useDragSensors } from "@/hooks/useDragSensors";
import { useLongPress } from "@/hooks/useLongPress";
import {
  composeTouchHandlers,
  type HandlerMap,
} from "@/lib/composeTouchHandlers";
import { moduleBadgeClass } from "@/lib/moduleStyles";
import { useDayPlanStore } from "@/store/dayPlanStore";
import type { DayPlanBlock, IDayPlan } from "@shared/types";

const MAX_CHIPS_PER_DAY = 4;

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
  const reflowBlock = useDayPlanStore((s) => s.reflowBlock);
  const grid = getMonthGrid(year, month);
  const planByDate = new Map(plans.map((p) => [p.date, p]));
  const today = toDateString(new Date());
  const sensors = useDragSensors();
  const [activeDrag, setActiveDrag] = useState<DayPlanBlock | null>(null);

  function findDragged(event: DragStartEvent | DragEndEvent) {
    const data = event.active.data.current as { blockId: string; date: string };
    const sourcePlan = planByDate.get(data.date);
    return sourcePlan?.blocks.find((b) => b.id === data.blockId) ?? null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDrag(findDragged(event));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;
    const dragged = findDragged(event);
    if (!dragged) return;
    const data = active.data.current as { date: string };

    // Pas de position du pointeur exploitable pour une heure ici : l'heure
    // cible est celle du chip survolé (seul signal de position disponible),
    // ou l'heure inchangée du bloc glissé si on lâche sur une case vide.
    // L'aperçu "faire de la place" pendant le survol, lui, est géré par
    // SortableContext/useSortable ci-dessous — plus besoin de le calculer
    // à la main : le résultat final (heures réelles) reste calculé par la
    // cascade, seule l'animation de prévisualisation vient de dnd-kit.
    const overData = over.data.current as
      | { date: string; time: string }
      | undefined;
    const targetDate = overData ? overData.date : (over.id as string);

    // Lâché précisément sur une autre chip du même jour : la direction
    // compte. En glissant vers le BAS (position d'origine avant la cible
    // dans l'ordre chronologique), on s'attend à atterrir APRÈS elle —
    // adopter son heure exacte nous ferait passer avant elle à tort (la
    // cascade tranche les égalités en faveur du glissé). En glissant vers
    // le HAUT, adopter son heure exacte correspond déjà à l'intuition : la
    // cible se retrouve poussée après nous.
    let newTime = dragged.time;
    if (overData) {
      const isSameDay = data.date === targetDate;
      const targetBlock = planByDate
        .get(targetDate)
        ?.blocks.find((b) => b.id === over.id);
      let movingDown = false;
      if (isSameDay && targetBlock) {
        const dayOrder = [...(planByDate.get(data.date)?.blocks ?? [])].sort(
          (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time),
        );
        const draggedIdx = dayOrder.findIndex((b) => b.id === dragged.id);
        const targetIdx = dayOrder.findIndex((b) => b.id === over.id);
        movingDown =
          draggedIdx !== -1 && targetIdx !== -1 && draggedIdx < targetIdx;
      }
      newTime =
        movingDown && targetBlock
          ? addMinutesToTime(targetBlock.time, targetBlock.duration)
          : overData.time;
    }

    if (targetDate === data.date && newTime === dragged.time) return;

    reflowBlock({
      block: dragged,
      targetDate,
      newTime,
      sourceDate: targetDate !== data.date ? data.date : undefined,
    });
  }

  return (
    <DndContext
      sensors={sensors}
      // Les chips sont minuscules et serrées : exiger que le pointeur soit
      // EXACTEMENT au-dessus d'une chip précise (comme pointerFirstCollisionDetection
      // le fait pour Day/Week) la rendait quasi impossible à viser en usage réel.
      // closestCenter choisit la zone de dépôt la plus proche géométriquement,
      // chip ou case du jour, sans exiger un survol pixel-parfait.
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDrag(null)}
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
                  className="min-h-20 border-b border-l border-black/5 sm:min-h-35"
                />
              );
            }

            const dateStr = toDateString(day);
            const plan = planByDate.get(dateStr);
            // Triés par heure : l'ordre du tableau en base reflète l'ordre
            // d'insertion, pas l'heure — sans ce tri, une cascade qui change
            // les heures ne se voit jamais ici (les chips gardent leur place).
            const blocks = [...(plan?.blocks ?? [])].sort(
              (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time),
            );
            const isToday = dateStr === today;
            const visibleBlocks = blocks.slice(0, MAX_CHIPS_PER_DAY);

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
                <SortableContext
                  items={visibleBlocks.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {visibleBlocks.map((block) => (
                    <SortableChip
                      key={block.id}
                      block={block}
                      dateStr={dateStr}
                      onEditBlock={onEditBlock}
                      onDeleteBlock={onDeleteBlock}
                    />
                  ))}
                </SortableContext>
                {blocks.length > MAX_CHIPS_PER_DAY && (
                  <p className="text-[8px] text-muted-foreground sm:text-[10px]">
                    +{blocks.length - MAX_CHIPS_PER_DAY} de plus
                  </p>
                )}
              </DayCell>
            );
          })}
        </div>
      </div>
      <DragOverlay>
        {activeDrag && <ChipVisual block={activeDrag} />}
      </DragOverlay>
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
        "min-h-20 space-y-1 border-b border-l border-black/5 p-1 transition-colors sm:min-h-35 sm:p-3.5",
        isOver && "bg-flowday/5",
      )}
    >
      {children}
    </div>
  );
}

interface ChipVisualProps {
  block: DayPlanBlock;
  deleteRevealed?: boolean;
  onDeleteBlock?: (blockId: string) => void;
}

// Rendu purement visuel — partagé par la chip interactive ci-dessous ET par
// son clone flottant dans le DragOverlay.
function ChipVisual({ block, deleteRevealed = false, onDeleteBlock }: ChipVisualProps) {
  return (
    <div
      className={cn(
        "group relative cursor-grab rounded px-1 py-0.5 text-[8px] font-medium active:cursor-grabbing sm:px-1.5 sm:text-[10px]",
        moduleBadgeClass[block.module],
      )}
    >
      <span className="block truncate">{block.title}</span>
      {onDeleteBlock && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteBlock(block.id);
          }}
          className={cn(
            "absolute -right-1.5 -top-1.5 z-10 hidden h-4 w-4 items-center justify-center rounded-full border border-black/10 bg-white text-black/40 shadow-sm hover:border-accent-danger/30 hover:text-accent-danger group-hover:flex",
            deleteRevealed && "flex",
          )}
          aria-label="Supprimer ce bloc"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

// Chip compacte sans axe horaire (jusqu'à MAX_CHIPS_PER_DAY par jour, le
// reste passe dans "+N de plus") — forme trop différente d'un bloc
// positionné par heure pour partager DraggableBlock (cf. DayTimelineView/
// WeekGridView).
//
// `useSortable` (plutôt que useDraggable+useDroppable séparés) : chaque
// jour est son propre SortableContext, donc dnd-kit anime automatiquement
// le "faire de la place" des autres chips du même jour pendant le survol —
// plus besoin de calculer nous-même un décalage en pixels. Le résultat réel
// au lâcher (les heures) reste calculé côté serveur par resolveCascade,
// inchangé ; seule la prévisualisation vient maintenant de dnd-kit.
// Le clone visible pendant le drag vit dans le <DragOverlay> de la vue
// parente (garantit qu'il reste toujours au-dessus des autres chips).
function SortableChip({
  block,
  dateStr,
  onEditBlock,
  onDeleteBlock,
}: {
  block: DayPlanBlock;
  dateStr: string;
  onEditBlock: (block: DayPlanBlock, date: string) => void;
  onDeleteBlock: (blockId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: block.id,
      data: { blockId: block.id, date: dateStr, time: block.time },
    });
  const [setLongPressRef, longPressRevealed, longPressTouchHandlers] =
    useLongPress<HTMLDivElement>();
  // `listeners` et `longPressTouchHandlers` vivent sur le même nœud ici —
  // sans fusion, le second écraserait le premier (voir composeTouchHandlers.ts).
  const touchHandlers = composeTouchHandlers(
    listeners as HandlerMap | undefined,
    longPressTouchHandlers,
  );

  // Même raison que DraggableBlock.tsx : `isDragging` passe à `true` dès le
  // délai tactile écoulé, même sans mouvement — un appui immobile pour
  // révéler le bouton supprimer ferait sinon disparaître la chip trop tôt.
  const hasReallyMoved = transform
    ? Math.abs(transform.x) > 3 || Math.abs(transform.y) > 3
    : false;
  const showDraggingVisual = isDragging && hasReallyMoved;

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setLongPressRef(node);
      }}
      {...attributes}
      {...touchHandlers}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        // "manipulation" (pas "none") : laisse le défilement tactile normal
        // se produire pendant le délai d'activation de TouchSensor.
        touchAction: "manipulation",
        // Sans ça, un appui maintenu et immobile se fait intercepter par la
        // sélection de texte du navigateur (ou le "callout" iOS) avant que
        // le glisser ait pu démarrer.
        WebkitUserSelect: "none",
        userSelect: "none",
        WebkitTouchCallout: "none",
      }}
      onClick={() => onEditBlock(block, dateStr)}
      className={cn(showDraggingVisual && "opacity-0")}
    >
      <ChipVisual
        block={block}
        deleteRevealed={longPressRevealed}
        onDeleteBlock={onDeleteBlock}
      />
    </div>
  );
}
