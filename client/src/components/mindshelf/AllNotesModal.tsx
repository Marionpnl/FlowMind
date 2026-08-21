import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bookmark, Quote, X } from "lucide-react";
import { useResourceStore } from "@/store/resourceStore";
import type { IResource } from "@shared/types";

interface AllNotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resources: IResource[];
  onSelectResource: (resource: IResource) => void;
}

export default function AllNotesModal({
  open,
  onOpenChange,
  resources,
  onSelectResource,
}: AllNotesModalProps) {
  const deleteNote = useResourceStore((s) => s.deleteNote);
  const notes = resources
    .flatMap((r) => r.notes.map((n) => ({ resource: r, note: n })))
    .sort(
      (a, b) =>
        new Date(b.note.createdAt).getTime() -
        new Date(a.note.createdAt).getTime(),
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-cream p-0 max-h-[85vh] flex flex-col">
        <div className="shrink-0 p-6 pb-4">
          <DialogHeader className="gap-1">
            <DialogTitle className="flex items-center gap-2 font-display text-2xl italic">
              <Bookmark className="h-5 w-5 text-mindshelf" />
              Toutes les notes
            </DialogTitle>
            <p className="text-sm text-black/60 text-muted-foreground">
              {notes.length} note{notes.length > 1 ? "s" : ""} au total
            </p>
          </DialogHeader>
        </div>

        <div className="space-y-2 overflow-y-auto px-6 pb-6">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune note pour l'instant.
            </p>
          ) : (
            notes.map(({ resource, note }) => (
              <div
                key={note.id}
                className="group relative rounded-xl bg-cream-secondary hover:z-10 hover:bg-black/5"
              >
                <button
                  onClick={() => {
                    onSelectResource(resource);
                    onOpenChange(false);
                  }}
                  className="block w-full p-4 text-left cursor-pointer"
                >
                  {note.isQuote && (
                    <Quote className="mb-2 h-3.5 w-3.5 text-mindshelf" />
                  )}
                  <p className="text-sm italic">"{note.content}"</p>
                  <p className="mt-1.5 font-mono text-xs text-black/60 text-muted-foreground">
                    {resource.title}
                    {note.page ? ` · p. ${note.page}` : ""}
                  </p>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(resource._id, note.id);
                  }}
                  className="absolute -right-2 -top-2 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-black/10 bg-white text-black/40 shadow-sm hover:border-accent-danger/30 hover:text-accent-danger group-hover:flex"
                  aria-label="Supprimer cette note"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
