import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Star,
  Clock,
  BookOpen,
  Trash2,
  Plus,
  Quote,
  Sparkles,
  CalendarPlus,
  X,
} from "lucide-react";
import { RESOURCE_TYPE_CONFIG, STATUS_LABELS } from "@/lib/resourceTypes";
import { useResourceStore } from "@/store/resourceStore";
import type { IResource, ResourceStatus } from "@shared/types";
import { cn } from "@/lib/utils";
import NewActivityModal from "@/components/widgets/NewActivityModal";

const STATUSES: { key: ResourceStatus; label: string }[] = [
  { key: "to-read", label: "À lire" },
  { key: "in-progress", label: "En cours" },
  { key: "done", label: "Terminé" },
];

interface ResourceDetailsModalProps {
  resource: IResource | null;
  onOpenChange: (open: boolean) => void;
}

export default function ResourceDetailsModal({
  resource,
  onOpenChange,
}: ResourceDetailsModalProps) {
  const updateResource = useResourceStore((s) => s.updateResource);
  const addNote = useResourceStore((s) => s.addNote);
  const deleteResource = useResourceStore((s) => s.deleteResource);
  const deleteNote = useResourceStore((s) => s.deleteNote);

  const [newNote, setNewNote] = useState("");
  const [newIsQuote, setNewIsQuote] = useState(false);
  const [newPage, setNewPage] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleSession, setScheduleSession] = useState(0);

  if (!resource) return null;

  const currentResource = resource;
  const { label: typeLabel } = RESOURCE_TYPE_CONFIG[resource.type];

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    await addNote(
      currentResource._id,
      newNote.trim(),
      newIsQuote,
      newPage.trim() || undefined,
    );
    setNewNote("");
    setNewIsQuote(false);
    setNewPage("");
    setAddingNote(false);
  }

  function openSchedule() {
    setScheduleSession((s) => s + 1);
    setScheduleOpen(true);
  }

  async function handleDelete() {
    await deleteResource(currentResource._id);
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={!!resource} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl overflow-hidden bg-cream p-0 max-h-[90vh] flex flex-col">
          {/* Bandeau coloré d'en-tête */}
          <div className="shrink-0 bg-mindshelf-bg p-6 pb-4">
            <DialogHeader className="gap-1">
              <span className="w-fit rounded-full bg-white px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-mindshelf">
                {typeLabel}
              </span>
              <DialogTitle className="mt-2 font-display text-2xl italic">
                {resource.title}
              </DialogTitle>
              {resource.author && (
                <p className="text-sm text-black/70 text-muted-foreground">
                  {resource.author}
                </p>
              )}
            </DialogHeader>

            {/* Ligne de stats */}
            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              <div className="min-w-0 rounded-xl border border-border bg-cream-secondary p-2 sm:p-3">
                <p className="flex items-center gap-1 truncate text-[8px] uppercase tracking-normal text-muted-foreground sm:text-xs sm:tracking-widest">
                  <BookOpen className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
                  <span className="truncate">Statut</span>
                </p>
                <p className="mt-1.5 truncate font-mono text-black/70 text-[10px] font-medium sm:text-xs">
                  {STATUS_LABELS[resource.status]}
                </p>
              </div>
              <div className="min-w-0 rounded-xl border border-border bg-cream-secondary p-2 sm:p-3">
                <p className="flex items-center gap-1 truncate text-[8px] uppercase tracking-normal text-muted-foreground sm:text-xs sm:tracking-widest">
                  <Clock className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
                  <span className="truncate">Progression</span>
                </p>
                <p className="mt-1.5 truncate font-mono text-[10px] text-black/70 font-medium sm:text-xs">
                  {resource.progress}%{" "}
                  {resource.currentPosition
                    ? `· ${resource.currentPosition}`
                    : ""}
                </p>
              </div>
              <div className="min-w-0 rounded-xl border border-border bg-cream-secondary p-2 sm:p-3">
                <p className="flex items-center gap-1 truncate text-[8px] uppercase tracking-normal text-muted-foreground sm:text-xs sm:tracking-widest">
                  <Star className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
                  <span className="truncate">Note</span>
                </p>
                <div className="mt-1.5 flex gap-0 sm:gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        updateResource(resource._id, { rating: i + 1 })
                      }
                    >
                      <Star
                        className={cn(
                          "h-3 w-3 sm:h-3.5 sm:w-3.5",
                          resource.rating && i < resource.rating
                            ? "fill-mindshelf text-mindshelf"
                            : "text-black/15",
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="space-y-4 overflow-y-auto p-5 pt-2 sm:p-8 sm:pt-2">
            {/* Changement de statut */}
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  onClick={() =>
                    updateResource(resource._id, { status: s.key })
                  }
                  className={cn(
                    "rounded-full border px-4 py-1 text-xs font-medium transition-colors",
                    resource.status === s.key
                      ? "border-mindshelf bg-mindshelf text-white"
                      : "bg-cream-secondary border-black/10 text-black/70 hover:border-black/30",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Notes & citations */}
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {resource.notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune note pour l'instant.
                </p>
              ) : (
                resource.notes.map((note) => (
                  <div
                    key={note.id}
                    className={cn(
                      "relative rounded-xl p-3 border border-black/5 text-sm",
                      note.isQuote
                        ? "bg-mindshelf-bg italic text-black/70"
                        : "bg-cream-secondary text-black/70",
                    )}
                  >
                    <button
                      onClick={() => deleteNote(currentResource._id, note.id)}
                      className="absolute right-2 top-2 text-black/30 hover:text-accent-danger"
                      aria-label="Supprimer la note"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    {note.isQuote && (
                      <Quote className="mb-2.5 h-3 w-3 text-mindshelf" />
                    )}
                    <p className="pr-5">{note.content}</p>
                    {note.page && (
                      <p className="mt-1 font-mono text-xs text-black/60 text-muted-foreground">
                        p. {note.page}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Ajouter une note */}
            <div className="rounded-xl border border-border bg-cream-secondary py-3 px-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Ajouter une note ou une citation..."
                rows={2}
                className="w-full resize-none bg-transparent text-xs italic outline-none"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-black/60 text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={newIsQuote}
                      onChange={(e) => setNewIsQuote(e.target.checked)}
                    />
                    C'est une citation
                  </label>
                  <input
                    value={newPage}
                    onChange={(e) => setNewPage(e.target.value)}
                    placeholder="p. 142"
                    className="w-16 rounded-md border border-black/5 bg-cream-secondary px-2 py-1 font-mono text-[10px] outline-none"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={addingNote || !newNote.trim()}
                  className="rounded-xl bg-mindshelf text-white hover:bg-mindshelf/90"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Ajouter
                </Button>
              </div>
            </div>

            {/* Suggestion IA */}
            <div className="rounded-xl bg-[#2B2A28] p-4 text-white">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-white/60">
                <Sparkles className="h-3.5 w-3.5" />
                Suggestion IA
              </p>
              <p className="font-display text-base italic leading-snug">
                À ton rythme, tu peux terminer ce livre d'ici le 24 juin —
                veux-tu bloquer 25 min chaque soir ?
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={handleDelete}
                  className="text-xs text-accent-danger hover:bg-accent-danger-bg"
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Supprimer
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={openSchedule}
                  className="rounded-xl bg-mindshelf text-white hover:bg-mindshelf/90"
                >
                  <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
                  Planifier une lecture
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <NewActivityModal
        key={scheduleSession}
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        defaultModule="MindShelf"
        defaultTitle={currentResource.title}
        defaultNotes={
          [currentResource.author, currentResource.currentPosition]
            .filter(Boolean)
            .join(" · ") || undefined
        }
      />
    </>
  );
}
