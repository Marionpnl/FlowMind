import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { mindshelfInProgress } from "@/lib/mockData";
import { useResourceStore, type RediscoveredNote } from "@/store/resourceStore";

export default function MindShelfCard() {
  const fetchRediscovery = useResourceStore((s) => s.fetchRediscovery);
  const [note, setNote] = useState<RediscoveredNote | null>(null);

  useEffect(() => {
    fetchRediscovery(1).then((result) => setNote(result[0] ?? null));
  }, [fetchRediscovery]);

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

      <div className="space-y-3">
        {mindshelfInProgress.map((book) => (
          <div key={book.id} className="flex items-center gap-3">
            <div className="h-19 w-13 shrink-0 rounded bg-mindshelf-bg" />
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
                {book.progress}% · {book.chapter}
              </span>
            </div>
          </div>
        ))}
      </div>

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
