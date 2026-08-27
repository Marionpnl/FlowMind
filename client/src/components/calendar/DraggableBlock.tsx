import { useDraggable, useDroppable } from "@dnd-kit/core";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { moduleBadgeClass, moduleSolidClass } from "@/lib/moduleStyles";
import { addMinutesToTime } from "@/lib/dateUtils";
import { useLongPress } from "@/lib/useLongPress";
import type { DayPlanBlock } from "@shared/types";

interface BlockVisualProps {
  block: DayPlanBlock;
  height: number;
  dense?: boolean;
  highlighted?: boolean;
  deleteRevealed?: boolean;
  onDeleteBlock?: (blockId: string) => void;
}

// Rendu purement visuel (couleur, titre, heure) — partagé par le bloc
// interactif ci-dessous ET par le clone flottant du DragOverlay (celui-ci
// n'a besoin d'aucun des hooks de drag, juste du même rendu).
export function BlockVisual({
  block,
  height,
  dense = false,
  highlighted = false,
  deleteRevealed = false,
  onDeleteBlock,
}: BlockVisualProps) {
  const isSolid = block.duration > 60;
  const isCompact = height < 44; // moins de 30 min : affichage réduit
  const timeColorClass = isSolid ? "text-white/80" : "text-black/60";

  return (
    <div
      className={cn(
        "group relative h-full w-full overflow-visible rounded-lg px-2",
        highlighted && "ring-2 ring-white",
        isCompact ? "flex items-center py-0" : "py-1",
        isSolid
          ? moduleSolidClass[block.module]
          : moduleBadgeClass[block.module],
      )}
    >
      {onDeleteBlock && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteBlock(block.id);
          }}
          className={cn(
            "absolute -right-2 -top-2 z-10 hidden h-5 w-5 items-center justify-center rounded-full border border-black/10 bg-white text-black/40 shadow-sm hover:border-accent-danger/30 hover:text-accent-danger group-hover:flex",
            deleteRevealed && "flex",
          )}
          aria-label="Supprimer ce bloc"
        >
          <X className="h-3 w-3" />
        </button>
      )}
      {isCompact ? (
        <p
          className={cn(
            "truncate font-medium",
            dense ? "text-[8px] sm:text-[11px]" : "text-xs",
          )}
        >
          {block.title}{" "}
          <span className={cn("font-mono font-normal", timeColorClass)}>
            · {block.time}
          </span>
        </p>
      ) : (
        <>
          <p
            className={cn(
              "truncate font-medium leading-tight",
              dense ? "text-[8px] sm:text-xs" : "text-sm",
            )}
          >
            {block.title}
          </p>
          <p
            className={cn(
              "truncate font-mono leading-tight",
              dense ? "text-[7px] sm:text-[10px]" : "text-xs",
              timeColorClass,
            )}
          >
            {block.time} - {addMinutesToTime(block.time, block.duration)}
          </p>
        </>
      )}
    </div>
  );
}

interface DraggableBlockProps {
  block: DayPlanBlock;
  top: number;
  height: number;
  // Absent en vue Jour (un seul jour affiché, pas besoin de le préciser) ;
  // présent en vue Semaine pour savoir vers/depuis quelle colonne on glisse.
  dateStr?: string;
  onEditBlock: (block: DayPlanBlock, dateStr?: string) => void;
  onDeleteBlock: (blockId: string) => void;
  // Décalage vertical (px) pendant qu'un autre bloc glissé le repousse en
  // cascade — non nul seulement si ce bloc précis fait partie de la chaîne.
  previewOffsetY: number | null;
  // Vue Semaine : colonnes étroites, texte plus petit qu'en vue Jour.
  dense?: boolean;
}

// Bloc "avec horaire" positionné sur l'axe des heures — partagé par
// DayTimelineView et WeekGridView. MonthGridView a sa propre DraggableChip :
// sans axe horaire, la forme est trop différente pour partager ce composant.
//
// Le bloc glissé lui-même ne se déplace plus par transform ici : le clone
// visible pendant le drag vit dans le <DragOverlay> de la vue parente
// ce qui garantit qu'il reste toujours visuellement au-dessus des autres blocs
// Un simple z-index entre éléments frères ne le garantissait pas de façon fiable.
// L'original reste ici à sa place (masqué via opacity) pour préserver la mise en page
// et rester la cible du drop.
export default function DraggableBlock({
  block,
  top,
  height,
  dateStr,
  onEditBlock,
  onDeleteBlock,
  previewOffsetY,
  dense = false,
}: DraggableBlockProps) {
  const { attributes, listeners, setNodeRef, isDragging, transform } =
    useDraggable({
      id: block.id,
      data: {
        blockId: block.id,
        originalTop: top,
        time: block.time,
        date: dateStr,
      },
    });
  const { setNodeRef: setDropRef } = useDroppable({
    id: block.id,
    data: { time: block.time, date: dateStr },
  });
  const [setLongPressRef, longPressRevealed, longPressTouchHandlers] =
    useLongPress<HTMLDivElement>();

  // `isDragging` passe à `true` dès que le délai tactile s'écoule, même sans
  // le moindre mouvement — un appui immobile pour révéler le bouton
  // supprimer ferait donc disparaître le bloc avant même d'atteindre son
  // propre délai, plus long. On ne bascule dans le rendu "glisser" (masqué,
  // remplacé par le clone du DragOverlay) qu'une fois un vrai mouvement
  // constaté, pas juste le délai écoulé.
  const hasReallyMoved = transform
    ? Math.abs(transform.x) > 3 || Math.abs(transform.y) > 3
    : false;
  const showDraggingVisual = isDragging && hasReallyMoved;

  const previewTransform =
    previewOffsetY !== null
      ? `translate3d(0px, ${previewOffsetY}px, 0)`
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
        top,
        height,
        transform: previewTransform,
        transition: previewTransform ? "transform 150ms ease" : undefined,
        // "manipulation" (pas "none") : laisse le défilement tactile normal
        // se produire pendant le délai d'activation de TouchSensor — "none"
        // bloquerait le scroll dès le premier contact, avant même que le
        // capteur ait pu décider si c'est un glisser ou un simple défilement.
        touchAction: "manipulation",
        // Sans ça, un appui maintenu et immobile (exactement le geste qui
        // active le glisser tactile) se fait intercepter par la sélection de
        // texte du navigateur — ou, sur iOS, par le "callout" (menu
        // Copier/Rechercher) — avant même que le glisser ait pu démarrer.
        WebkitUserSelect: "none",
        userSelect: "none",
        WebkitTouchCallout: "none",
      }}
      onClick={() => onEditBlock(block, dateStr)}
      className={cn(
        "absolute left-1 right-1 cursor-grab active:cursor-grabbing",
        showDraggingVisual && "opacity-0",
        previewOffsetY !== null && "z-10",
      )}
    >
      <BlockVisual
        block={block}
        height={height}
        dense={dense}
        highlighted={previewOffsetY !== null}
        onDeleteBlock={onDeleteBlock}
        deleteRevealed={longPressRevealed}
      />
    </div>
  );
}
