import { useEffect, useState } from "react";
import { Bookmark, Quote } from "lucide-react";
import {
  useResourceStore,
  type RediscoveredNote,
} from "@/store/resourceStore";
import { useAuthStore } from "@/store/authStore";

interface NotesRediscoveryPanelProps {
  onOpenAllNotes: () => void;
}

export default function NotesRediscoveryPanel({
  onOpenAllNotes,
}: NotesRediscoveryPanelProps) {
  const fetchRediscovery = useResourceStore((s) => s.fetchRediscovery);
  const [notes, setNotes] = useState<RediscoveredNote[]>([]);
  const dailyRediscovery =
    useAuthStore((s) => s.user?.preferences?.dailyRediscovery) ?? true;

  useEffect(() => {
    if (!dailyRediscovery) return;
    fetchRediscovery(2).then((result) => setNotes(result));
  }, [dailyRediscovery, fetchRediscovery]);

  if (!dailyRediscovery) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide">
          <Bookmark className="h-4.5 w-4.5 text-mindshelf" />
          Notes — Redécouverte du jour
        </h2>
        <p className="text-sm text-muted-foreground">
          Redécouverte du jour désactivée dans tes paramètres.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide">
          <Bookmark className="h-4.5 w-4.5 text-mindshelf" />
          Notes — Redécouverte du jour
        </h2>
        <button
          onClick={onOpenAllNotes}
          className="text-xs text-black/70 text-muted-foreground hover:underline cursor-pointer"
        >
          Tout voir
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Prends des notes sur tes lectures pour en redécouvrir plus tard.
        </p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.noteId} className="rounded-xl bg-mindshelf-bg p-5">
              {note.isQuote && (
                <Quote className="mb-3 h-4 w-4 text-mindshelf" />
              )}
              <p className="text-sm italic">"{note.content}"</p>
              <p className="mt-2 font-mono text-xs text-black/60 text-muted-foreground">
                {note.resourceTitle}
                {note.page ? ` · p. ${note.page}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
