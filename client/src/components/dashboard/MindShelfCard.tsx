import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import {
  useResourceStore,
  type RediscoveredNote,
} from "@/store/resourceStore";

// Certaines couvertures OpenLibrary redirigent vers un chemin d'extraction
// archive.org peu fiable (parfois cassé) — repli sur l'icône si l'image
// échoue réellement à charger, plutôt qu'une case vide.
function BookCover({ coverUrl }: { coverUrl?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex h-19 w-13 shrink-0 items-center justify-center overflow-hidden rounded bg-mindshelf-bg">
      {coverUrl && !failed ? (
        <img
          src={coverUrl}
          alt=""
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <BookOpen className="h-5 w-5 text-mindshelf" />
      )}
    </div>
  );
}

export default function MindShelfCard() {
  const resources = useResourceStore((s) => s.resources);
  const fetchResources = useResourceStore((s) => s.fetchResources);
  const fetchRediscovery = useResourceStore((s) => s.fetchRediscovery);
  const [note, setNote] = useState<RediscoveredNote | null>(null);

  useEffect(() => {
    fetchResources();
    fetchRediscovery(1).then((result) => setNote(result[0] ?? null));
  }, [fetchResources, fetchRediscovery]);

  const inProgress = resources
    .filter((r) => r.status === "in-progress")
    .slice(0, 2);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-mindshelf">
          <span className="h-1.5 w-1.5 rounded-full bg-mindshelf" />
          MindShelf · En cours
        </p>
        <Link
          to="/mindshelf"
          className="text-[10px] sm:text-xs text-black/70 text-muted-foreground hover:underline"
        >
          Voir tout
        </Link>
      </div>

      {inProgress.length === 0 ? (
        <p className="text-xs sm:text-sm text-muted-foreground">
          Aucun livre en cours pour l'instant.
        </p>
      ) : (
        <div className="space-y-3">
          {inProgress.map((book) => (
            <div key={book._id} className="flex items-center gap-3">
              <BookCover coverUrl={book.coverUrl} />
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium">{book.title}</p>
                <p className="text-[10px] sm:text-xs text-black/70 text-muted-foreground">
                  {book.author}
                </p>
                <div className="mt-2 h-1 rounded-full bg-black/5">
                  <div
                    className="h-1 rounded-full bg-mindshelf"
                    style={{ width: `${book.progress}%` }}
                  />
                </div>
                <span className="text-[10px] sm:text-xs text-black/60 font-mono text-muted-foreground">
                  {book.progress}%
                  {book.currentPosition ? ` · ${book.currentPosition}` : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {note && (
        <div className="mt-4 rounded-xl bg-mindshelf-bg p-3">
          <p className="text-xs font-medium uppercase tracking-widest text-mindshelf">
            Redécouverte du jour
          </p>
          <p className="mt-2 text-xs sm:text-sm italic">"{note.content}"</p>
          <p className="mt-2 text-[10px] sm:text-xs text-black/60 font-mono text-muted-foreground">
            {note.resourceTitle}
          </p>
        </div>
      )}
    </div>
  );
}
