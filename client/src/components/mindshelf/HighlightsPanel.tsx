import { Bookmark, Quote } from "lucide-react";
import type { IResource } from "@shared/types";

interface Highlight {
  content: string;
  source: string;
}

export default function HighlightsPanel({
  resources,
}: {
  resources: IResource[];
}) {
  const highlights: Highlight[] = resources
    .flatMap((r) =>
      r.notes
        .filter((n) => n.isQuote)
        .map((n) => ({ content: n.content, source: r.title })),
    )
    .slice(0, 5);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide">
          <Bookmark className="h-4.5 w-4.5 text-mindshelf" />
          Surlignages récents
        </h2>
        <button className="text-xs text-black/70 text-muted-foreground hover:underline">
          Voir tout
        </button>
      </div>

      {highlights.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun surlignage pour l'instant.
        </p>
      ) : (
        <div className="space-y-3">
          {highlights.map((h, idx) => (
            <div key={idx} className="rounded-xl bg-mindshelf-bg p-5">
              <Quote className="mb-3 h-4 w-4 text-mindshelf" />
              <p className="text-sm italic">"{h.content}"</p>
              <p className="mt-2 font-mono text-xs text-black/60 text-muted-foreground">
                {h.source}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
