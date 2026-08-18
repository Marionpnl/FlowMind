import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RESOURCE_TYPE_CONFIG, CATEGORIES } from "@/lib/resourceTypes";
import { useResourceStore } from "@/store/resourceStore";
import type { ResourceStatus, ResourceType } from "@shared/types";
import { cn } from "@/lib/utils";

const STATUSES: { key: ResourceStatus; label: string }[] = [
  { key: "in-progress", label: "En cours" },
  { key: "to-read", label: "À lire" },
  { key: "done", label: "Terminé" },
];

interface BookCandidate {
  title: string;
  author?: string;
  coverUrl?: string;
  isbn?: string;
}

interface NewResourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewResourceModal({
  open,
  onOpenChange,
}: NewResourceModalProps) {
  const addResource = useResourceStore((s) => s.addResource);
  const addNote = useResourceStore((s) => s.addNote);
  const searchByTitle = useResourceStore((s) => s.searchByTitle);

  const [type, setType] = useState<ResourceType>("book");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | undefined>();
  const [isbn, setIsbn] = useState<string | undefined>();
  const [status, setStatus] = useState<ResourceStatus>("to-read");
  const [category, setCategory] = useState<string | null>(null);
  const [firstNote, setFirstNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [candidates, setCandidates] = useState<BookCandidate[]>([]);
  const [showCandidates, setShowCandidates] = useState(false);
  const [searching, setSearching] = useState(false);

  // Title search with debounce, only for the "book" type
  useEffect(() => {
    if (type !== "book" || title.trim().length < 3 || coverUrl) {
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      const results = await searchByTitle(title.trim());
      setCandidates(results);
      setShowCandidates(true);
      setSearching(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [title, type, coverUrl, searchByTitle]);

  function selectCandidate(candidate: BookCandidate) {
    setTitle(candidate.title);
    setAuthor(candidate.author || "");
    setCoverUrl(candidate.coverUrl);
    setIsbn(candidate.isbn);
    setShowCandidates(false);
    setCandidates([]);
  }

  async function handleSubmit() {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const created = await addResource({
        type,
        title: title.trim(),
        author: author.trim() || undefined,
        coverUrl,
        isbn,
        status,
        tags: category ? [category] : [],
      });

      if (created && firstNote.trim()) {
        await addNote(created._id, firstNote.trim(), false);
      }

      resetForm();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setType("book");
    setTitle("");
    setAuthor("");
    setCoverUrl(undefined);
    setIsbn(undefined);
    setStatus("to-read");
    setCategory(null);
    setFirstNote("");
    setCandidates([]);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-cream p-5 sm:p-8">
        <DialogHeader>
          <DialogTitle className="mt-3 font-display text-xl italic">
            Ajouter {type === "book" ? "un livre" : "une ressource"}
          </DialogTitle>
          <DialogDescription className="text-xs text-black/70 text-muted-foreground">
            {type === "book"
              ? "Renseigne le titre — l'IA complétera l'auteur et la couverture."
              : "Renseigne les détails de ta ressource."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resource Type */}
          <div>
            <label className="text-xs text-black/70 font-medium uppercase tracking-widest text-muted-foreground">
              Type
            </label>
            <div className="mt-1 flex flex-wrap gap-1">
              {(Object.keys(RESOURCE_TYPE_CONFIG) as ResourceType[]).map(
                (t) => {
                  const { label, Icon } = RESOURCE_TYPE_CONFIG[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setType(t);
                        setCoverUrl(undefined);
                        setCandidates([]);
                      }}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        type === t
                          ? "border-mindshelf bg-mindshelf text-white"
                          : "bg-cream-secondary border-black/10 text-black/70 hover:border-black/30",
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {/* Cover */}
            <div className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-mindshelf-bg">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs text-mindshelf">📖</span>
              )}
            </div>

            <div className="flex-1 space-y-3">
              {/* Title with search */}
              <div className="relative">
                <label className="text-xs text-black/70 font-medium uppercase tracking-widest text-muted-foreground">
                  Titre
                </label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setCoverUrl(undefined); // Reset coverUrl when title changes
                  }}
                  placeholder="Ex. Refactoring"
                  className="mt-1 bg-cream-secondary"
                />

                {showCandidates && candidates.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-white shadow-lg">
                    {candidates.map((c, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectCandidate(c)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-black/5"
                      >
                        {c.coverUrl && (
                          <img
                            src={c.coverUrl}
                            alt=""
                            className="h-8 w-6 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium">{c.title}</p>
                          {c.author && (
                            <p className="text-xs text-muted-foreground">
                              {c.author}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searching && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Recherche...
                  </p>
                )}
              </div>

              {/* Author */}
              <div>
                <label className="text-xs text-black/70 font-medium uppercase tracking-widest text-muted-foreground">
                  Auteur
                </label>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Ex. Martin Fowler"
                  className="mt-1 bg-cream-secondary"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs text-black/70 font-medium uppercase tracking-widest text-muted-foreground">
              Statut
            </label>
            <div className="mt-1 flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStatus(s.key)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
                    status === s.key
                      ? "border-mindshelf bg-mindshelf text-white"
                      : "bg-cream-secondary border-black/10 text-black/70 hover:border-black/30",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-black/70 font-medium uppercase tracking-widest text-muted-foreground">
              Catégorie
            </label>
            <div className="mt-1 flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(category === cat ? null : cat)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    category === cat
                      ? "border-mindshelf bg-mindshelf text-white"
                      : "bg-cream-secondary border-black/10 text-black/70 hover:border-black/30",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* First note */}
          <div>
            <label className="text-xs text-black/70 font-medium uppercase tracking-widest text-muted-foreground">
              Première note
            </label>
            <textarea
              value={firstNote}
              onChange={(e) => setFirstNote(e.target.value)}
              placeholder="Pourquoi ce livre ? Ce que tu veux en retirer..."
              rows={2}
              className="mt-1 w-full resize-none rounded-lg border border-border bg-cream-secondary p-4 text-xs font-medium outline-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-black/70"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !title.trim()}
            className="bg-mindshelf text-white text-xs hover:bg-mindshelf/90"
          >
            {submitting ? "Ajout..." : "+ Ajouter à la bibliothèque"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
