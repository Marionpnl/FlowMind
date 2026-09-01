import { useEffect, useState } from "react";
import { BookPlus, Check, ExternalLink, Plus, RefreshCw } from "lucide-react";
import { useResourceStore, type SuggestedBook } from "@/store/resourceStore";
import { cn } from "@/lib/utils";

export default function BookSuggestionsPanel() {
  const fetchBookSuggestions = useResourceStore((s) => s.fetchBookSuggestions);
  const addResource = useResourceStore((s) => s.addResource);
  const [suggestions, setSuggestions] = useState<SuggestedBook[]>([]);
  const [addedTitles, setAddedTitles] = useState<string[]>([]);
  const [addingTitle, setAddingTitle] = useState<string | null>(null);
  // Cette route est plus lente que les autres suggestions IA (un appel
  // OpenAI suivi de plusieurs recherches OpenLibrary pour vérifier chaque
  // titre) — sans indicateur, l'onglet paraîtrait vide pendant plusieurs
  // secondes, comme si le tab n'avait aucun contenu.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookSuggestions().then((result) => {
      setSuggestions(result);
      setLoading(false);
    });
  }, [fetchBookSuggestions]);

  async function handleRegenerate() {
    setLoading(true);
    const result = await fetchBookSuggestions();
    setSuggestions(result);
    setLoading(false);
  }

  async function handleAdd(suggestion: SuggestedBook) {
    setAddingTitle(suggestion.title);
    try {
      await addResource({
        type: "book",
        title: suggestion.title,
        author: suggestion.author,
        coverUrl: suggestion.coverUrl,
        isbn: suggestion.isbn,
        status: "to-read",
      });
      setAddedTitles((prev) => [...prev, suggestion.title]);
    } finally {
      setAddingTitle(null);
    }
  }

  return (
    <div>
      {loading ? (
        <p className="text-sm text-muted-foreground">
          Recherche de suggestions...
        </p>
      ) : suggestions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ajoute des livres ou des centres d'intérêt pour recevoir des
          suggestions de lecture.
        </p>
      ) : (
        <div className="space-y-2.5">
          {suggestions.map((s) => {
            const isAdded = addedTitles.includes(s.title);
            return (
              <div
                key={s.title}
                className="flex items-start gap-5 rounded-xl bg-cream-secondary px-4 py-3"
              >
                <SuggestionCover coverUrl={s.coverUrl} />
                <div className="min-w-0 flex-1">
                  <p className="pb-0.5 truncate text-sm font-medium">
                    {s.title}
                  </p>
                  {s.author && (
                    <p className="pb-2 truncate font-mono text-xs text-black/60 text-muted-foreground">
                      {s.author}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-black/60 text-muted-foreground">
                    {s.reason}
                  </p>
                  {s.link && (
                    <a
                      href={s.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-xs text-black/60 hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Voir sur Google Books
                    </a>
                  )}
                </div>
                <button
                  onClick={() => handleAdd(s)}
                  disabled={isAdded || addingTitle === s.title}
                  aria-label={`Ajouter ${s.title} à la bibliothèque`}
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full disabled:opacity-50 cursor-pointer",
                    isAdded
                      ? "bg-mindshelf text-white"
                      : "bg-white text-mindshelf hover:bg-mindshelf-bg",
                  )}
                >
                  {isAdded ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex justify-end">
        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-mindshelf hover:underline disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Régénérer
        </button>
      </div>
    </div>
  );
}

// Certaines couvertures OpenLibrary redirigent vers un chemin d'extraction
// archive.org peu fiable (parfois cassé) — repli sur l'icône si l'image
// échoue réellement à charger, plutôt qu'une case vide.
function SuggestionCover({ coverUrl }: { coverUrl?: string }) {
  const [failed, setFailed] = useState(false);

  if (coverUrl && !failed) {
    return (
      <img
        src={coverUrl}
        alt=""
        onError={() => setFailed(true)}
        className="h-30 w-22 shrink-0 rounded object-cover"
      />
    );
  }

  return (
    <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded bg-mindshelf-bg text-mindshelf">
      <BookPlus className="h-5 w-5" />
    </div>
  );
}
