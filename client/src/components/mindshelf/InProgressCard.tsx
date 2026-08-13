import { BookOpen } from "lucide-react";
import type { IResource } from "@shared/types";

interface InProgressCardProps {
  resource: IResource;
  onClick: () => void;
}

export default function InProgressCard({
  resource,
  onClick,
}: InProgressCardProps) {
  const notesCount = resource.notes.length;

  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-4 rounded-2xl bg-white p-4 text-left border border-black/5 shadow-sm cursor-pointer"
    >
      <div className="flex h-26 w-17 shrink-0 items-center justify-center overflow-hidden rounded-md bg-mindshelf-bg border border-black/5">
        {resource.coverUrl ? (
          <img
            src={resource.coverUrl}
            alt={resource.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <BookOpen className="h-6 w-6 text-mindshelf" />
        )}
      </div>

      <div className="flex-1">
        {resource.tags[0] && (
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {resource.tags[0]}
          </p>
        )}
        <p className="mt-2 text-sm font-medium">{resource.title}</p>
        {resource.author && (
          <p className="text-xs text-black/65 text-muted-foreground">
            {resource.author}
          </p>
        )}

        <div className="mt-3 h-1.5 rounded-full bg-black/5">
          <div
            className="h-1 rounded-full bg-mindshelf"
            style={{ width: `${resource.progress}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between font-mono text-black/65 text-xs text-muted-foreground">
          <span>
            {resource.progress}%{" "}
            {resource.currentPosition ? `· ${resource.currentPosition}` : ""}
          </span>
          <span>{notesCount} notes</span>
        </div>
      </div>
    </button>
  );
}
