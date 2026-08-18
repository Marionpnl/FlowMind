import { Star } from "lucide-react";
import { STATUS_LABELS } from "@/lib/resourceTypes";
import type { IResource } from "@shared/types";
import { cn } from "@/lib/utils";

interface LibraryRowProps {
  resource: IResource;
  onClick: () => void;
}

export default function LibraryRow({ resource, onClick }: LibraryRowProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between border-b border-black/5 py-3 text-left last:border-0 cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mindshelf-bg border border-black/5 text-mindshelf">
          📖
        </div>
        <div>
          <p className="text-xs sm:text-sm font-medium">{resource.title}</p>
          {resource.author && (
            <p className="text-[10px] sm:text-xs text-black/70 text-muted-foreground">
              {resource.author}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {resource.rating !== undefined && (
          <div className="flex">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3 sm:h-3.5 sm:w-3.5",
                  i < resource.rating!
                    ? "fill-mindshelf text-mindshelf"
                    : "text-black/15",
                )}
              />
            ))}
          </div>
        )}
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
            resource.status === "done"
              ? "bg-flowday-bg text-flowday"
              : resource.status === "in-progress"
                ? "bg-mindshelf-bg text-mindshelf"
                : "bg-black/5 text-muted-foreground",
          )}
        >
          {STATUS_LABELS[resource.status]}
        </span>
      </div>
    </button>
  );
}
