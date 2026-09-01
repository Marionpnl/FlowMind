import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, X } from "lucide-react";
import { moduleBadgeClass, moduleDotClass } from "@/lib/moduleStyles";
import { cn } from "@/lib/utils";
import { useLongPress } from "@/hooks/useLongPress";
import { useDragSensors } from "@/hooks/useDragSensors";
import { useDayPlanStore } from "@/store/dayPlanStore";
import type { DayPlanBlock } from "@shared/types";

interface TodayPlanningProps {
  blocks: DayPlanBlock[];
  onToggleBlock: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onEditBlock: (block: DayPlanBlock) => void;
}

export default function TodayPlanning({
  blocks = [],
  onToggleBlock,
  onDeleteBlock,
  onEditBlock,
}: TodayPlanningProps) {
  const updateBlock = useDayPlanStore((s) => s.updateBlock);

  // Pas d'axe horaire ici (liste simple, contrairement aux vues Calendrier) :
  // la position affichée d'un bloc vient uniquement de l'ordre dans le
  // tableau, donc on trie par heure pour que la liste reste chronologique.
  // Sans ce tri, échanger les heures au drop ne changerait jamais l'ordre
  // visuel — c'est ce qui causait le "retour à la position d'origine".
  const sortedBlocks = [...blocks].sort((a, b) => a.time.localeCompare(b.time));

  const sensors = useDragSensors();

  // Réordonner visuellement doit réassigner les horaires pour que la liste
  // reste triée par heure. On répartit les horaires du nouvel ordre sur les
  // créneaux déjà occupés par l'ancien ordre (les blocs "gardent leurs places").
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedBlocks.findIndex((b) => b.id === active.id);
    const newIndex = sortedBlocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const times = sortedBlocks.map((b) => b.time);
    const reordered = arrayMove(sortedBlocks, oldIndex, newIndex);
    reordered.forEach((block, i) => {
      if (block.time !== times[i]) {
        updateBlock(block.id, { time: times[i] });
      }
    });
  }

  return (
    <div>
      {sortedBlocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun planning généré pour aujourd'hui. Décris ta journée ci-dessus
          pour commencer.
        </p>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <ul className="relative space-y-3">
            <div className="absolute left-[47px] top-2 bottom-2 w-px bg-black/10" />

            <SortableContext
              items={sortedBlocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {sortedBlocks.map((block) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  onToggleBlock={onToggleBlock}
                  onDeleteBlock={onDeleteBlock}
                  onEditBlock={onEditBlock}
                />
              ))}
            </SortableContext>
          </ul>
        </DndContext>
      )}
    </div>
  );
}

function SortableBlock({
  block,
  onToggleBlock,
  onDeleteBlock,
  onEditBlock,
}: {
  block: DayPlanBlock;
  onToggleBlock: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onEditBlock: (block: DayPlanBlock) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });
  const [setLongPressRef, longPressRevealed, longPressTouchHandlers] =
    useLongPress<HTMLDivElement>();

  // `isDragging` passe à `true` dès que le délai tactile s'écoule, même sans
  // mouvement — un appui immobile pour révéler le bouton supprimer (délai
  // plus long, 500ms) ferait sinon passer ce bloc en z-20/shadow-lg presque
  // immédiatement, rendant la différence entre les deux gestes imperceptible.
  // On ne bascule dans le rendu "glisser" qu'une fois un vrai mouvement constaté.
  const hasReallyMoved =
    Math.abs(transform?.x ?? 0) > 3 || Math.abs(transform?.y ?? 0) > 3;
  const showDraggingVisual = isDragging && hasReallyMoved;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Sans ça, un appui maintenu et immobile se fait intercepter par la
    // sélection de texte du navigateur (ou le "callout" iOS) avant que le
    // glisser ait pu démarrer.
    WebkitUserSelect: "none" as const,
    userSelect: "none" as const,
    WebkitTouchCallout: "none" as const,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        // "manipulation" (pas "none") : laisse le défilement tactile normal
        // se produire pendant le délai d'activation de TouchSensor.
        "relative flex touch-manipulation items-start gap-3",
        showDraggingVisual && "z-20",
      )}
    >
      <span className="w-12 shrink-0 pt-4 font-mono text-black/70 text-xs text-muted-foreground">
        {block.time}
      </span>
      <span
        className={cn(
          "relative z-10 mt-4 sm:mr-4 h-2 w-2 sm:h-3 sm:w-3 shrink-0 rounded-full",
          moduleDotClass[block.module],
        )}
      />
      <div
        ref={setLongPressRef}
        {...longPressTouchHandlers}
        onClick={() => onEditBlock(block)}
        className={cn(
          "group relative flex-1 cursor-grab rounded-2xl bg-white p-3 sm:p-4 shadow-sm active:cursor-grabbing",
          showDraggingVisual && "shadow-lg",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 sm:gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBlock(block.id);
              }}
              className={cn(
                "mt-0.5 flex h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 items-center justify-center rounded-full border",
                block.done
                  ? "border-flowday bg-flowday text-white"
                  : "border-black/20 text-transparent",
              )}
            >
              <Check className="h-3 w-3 cursor-pointer" />
            </button>
            <div>
              <p
                className={cn(
                  "text-sm font-medium",
                  block.done && "text-muted-foreground line-through",
                )}
              >
                {block.title}
              </p>
              <p className="text-[11px] sm:text-xs text-black/70 text-muted-foreground">
                {block.duration ? `${block.duration} min` : ""} ·{" "}
                {block.subtitle}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-medium uppercase tracking-wider",
              moduleBadgeClass[block.module],
            )}
          >
            {block.module}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteBlock(block.id);
          }}
          className={cn(
            "absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full border border-black/10 bg-white text-black/40 shadow-sm hover:border-accent-danger/30 hover:text-accent-danger group-hover:flex",
            longPressRevealed && "flex",
          )}
          aria-label="Supprimer ce bloc"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}
