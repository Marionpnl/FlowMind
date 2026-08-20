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
import { DAY_LABELS, getWeekDays, toDateString } from "@/lib/dateUtils";
import { pointerFirstCollisionDetection } from "@/lib/dndCollision";
import { useDayPlanStore } from "@/store/dayPlanStore";
import type { DayPlanBlock, IDayPlan } from "@shared/types";

const START_HOUR = 7;
const END_HOUR = 23;
const HOUR_HEIGHT = 60;

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

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function addMinutes(time: string, minutes: number): string {
  return minutesToTime(timeToMinutes(time) + minutes);
}

interface BlockDropData {
  date: string;
  time: string;
}

// Aperçu en direct de l'échange : pendant le survol d'un autre bloc, on lui
// applique une translation calculée à partir des rects réels mesurés par
// dnd-kit (celui du bloc glissé à son point de départ, et celui de la
// cible) — pas besoin de connaître la largeur des colonnes à la main, ça
// marche aussi bien pour un échange dans le même jour qu'entre deux jours.
// Seule la position change dans l'aperçu, jamais la taille : la cible garde
// sa propre hauteur pendant le survol. On avait essayé de lui faire prendre
// la hauteur du bloc glissé pour prévisualiser l'échange complet, mais ça
// modifie sa vraie taille affichée — et dnd-kit re-mesure les zones de dépôt
// sur cette taille réelle, donc un grand bloc rétréci en aperçu perdait le
// pointeur et l'échange ne se déclenchait plus (repéré en glissant un petit
// bloc sur un grand : la cible rétrécissait et le dépôt était raté).
interface SwapPreview {
  targetId: string;
  dx: number;
  dy: number;
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
  const updateBlock = useDayPlanStore((s) => s.updateBlock);
  const days = getWeekDays(weekStart);
  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i,
  );
  const planByDate = new Map(plans.map((p) => [p.date, p]));
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
    // On ne recalcule dx/dy qu'une fois par cible survolée : `over.rect`
    // reflète la position RÉELLEMENT AFFICHÉE (donc déjà décalée par notre
    // propre transform d'aperçu une fois appliquée)
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
    const { active, over, delta } = event;
    if (!over) return;
    const data = active.data.current as {
      blockId: string;
      originalTop: number;
      date: string;
      time: string;
    };

    // Lâché directement sur un autre bloc : les deux échangent leur créneau
    // (jour + heure) mais gardent chacun leur propre durée — seule la place
    // dans le planning change, pas la nature du bloc. Les deux mises à jour
    // sont séquencées (la seconde attend la fin de la première) plutôt que
    // lancées en parallèle : un échange entre deux jours différents modifie
    // deux documents via un "lire puis sauvegarder" côté serveur qui n'est
    // pas atomique — deux requêtes concurrentes sur la même paire de jours
    // peuvent s'écraser l'une l'autre et perdre/mélanger des blocs.
    const overData = over.data.current as BlockDropData | undefined;
    if (overData && over.id !== active.id) {
      await updateBlock(data.blockId, {
        date: overData.date,
        time: overData.time,
      });
      await updateBlock(over.id as string, {
        date: data.date,
        time: data.time,
      });
      return;
    }

    // Lâché sur une case vide de la colonne du jour : déplacement libre.
    const newDate = over.id as string;
    const newTop = data.originalTop + delta.y;
    const rawMinutes = START_HOUR * 60 + (newTop / HOUR_HEIGHT) * 60;
    const snapped = Math.round(rawMinutes / 15) * 15;
    const clamped = Math.max(
      START_HOUR * 60,
      Math.min(END_HOUR * 60 + 45, snapped),
    );
    updateBlock(data.blockId, { date: newDate, time: minutesToTime(clamped) });
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
        {/* En-têtes des jours */}
        <div className="grid grid-cols-[36px_repeat(7,1fr)] border-b border-black/5 sm:grid-cols-[64px_repeat(7,1fr)]">
          <div />
          {days.map((day, i) => (
            <div
              key={i}
              className="border-l border-black/5 px-1 py-2 sm:px-3 sm:py-3"
            >
              <p className="text-[9px] text-black/60 font-medium uppercase tracking-widest text-muted-foreground sm:text-xs">
                {DAY_LABELS[i]}
              </p>
              <p className="pt-1 font-mono text-xs text-black/70 tracking-widest font-medium sm:text-sm">
                {day.getDate()}
              </p>
            </div>
          ))}
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
              <DayColumn key={dayIdx} dateStr={dateStr}>
                {hours.map((h, idx) => (
                  <div
                    key={h}
                    style={{ height: HOUR_HEIGHT }}
                    className={cn(idx !== 0 && "border-t border-black/5")}
                  />
                ))}

                {blocks.map((block) => (
                  <DraggableBlock
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
              </DayColumn>
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}

function DayColumn({
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
        "relative border-l border-black/5 transition-colors",
        isOver && "bg-flowday/5",
      )}
    >
      {children}
    </div>
  );
}

function DraggableBlock({
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
  const startMinutes = timeToMinutes(block.time) - START_HOUR * 60;
  const top = (startMinutes / 60) * HOUR_HEIGHT;
  const height = (block.duration / 60) * HOUR_HEIGHT;
  const isSolid = block.duration > 60;
  const isCompact = height < 44;
  const timeColorClass = isSolid ? "text-white/80" : "text-black/60";

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: block.id,
      data: {
        blockId: block.id,
        originalTop: top,
        date: dateStr,
        time: block.time,
      },
    });
  const { setNodeRef: setDropRef } = useDroppable({
    id: block.id,
    data: { date: dateStr, time: block.time } satisfies BlockDropData,
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
        transform: transform
          ? CSS.Translate.toString(transform)
          : previewTransform,
        transition: previewTransform ? "transform 150ms ease" : undefined,
        touchAction: "none",
      }}
      onClick={() => onEditBlock(block, dateStr)}
      className={cn(
        "group absolute left-1 right-1 cursor-grab overflow-hidden rounded-lg px-2 active:cursor-grabbing",
        isDragging && "z-20 shadow-lg",
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
        className={cn(
          "absolute right-1 top-1 hidden rounded-full p-0.5 group-hover:block",
          isSolid ? "hover:bg-white/20" : "hover:bg-black/10",
        )}
        aria-label="Supprimer ce bloc"
      >
        <X className="h-3 w-3" />
      </button>
      {isCompact ? (
        <p className="truncate text-[8px] font-medium sm:text-[11px]">
          {block.title}{" "}
          <span className={cn("font-mono font-normal", timeColorClass)}>
            · {block.time}
          </span>
        </p>
      ) : (
        <>
          <p className="truncate text-[8px] font-medium leading-tight sm:text-xs">
            {block.title}
          </p>
          <p
            className={cn(
              "truncate font-mono text-[7px] leading-tight sm:text-[10px]",
              timeColorClass,
            )}
          >
            {block.time} - {addMinutes(block.time, block.duration)}
          </p>
        </>
      )}
    </div>
  );
}
