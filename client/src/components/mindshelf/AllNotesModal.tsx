import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bookmark, Quote } from "lucide-react";
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
              <button
                key={note.id}
                onClick={() => {
                  onSelectResource(resource);
                  onOpenChange(false);
                }}
                className="block w-full rounded-xl bg-cream-secondary p-4 text-left hover:bg-black/5 cursor-pointer"
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
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
