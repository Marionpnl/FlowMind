import { Star } from "lucide-react";
import { STATUS_LABELS } from "@/lib/resourceTypes";
import type { IResource } from "@shared/types";
import { cn } from "@/lib/utils";

export default function LibraryRow({ resource }: { resource: IResource }) {
  return (
    <div className="flex items-center justify-between border-b border-black/5 py-3 last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-mindshelf-bg border border-black/5 text-mindshelf">
          📖
        </div>
        <div>
          <p className="text-sm font-medium">{resource.title}</p>
          {resource.author && (
            <p className="text-xs text-black/70 text-muted-foreground">
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
                  "h-3.5 w-3.5",
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
            "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
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
    </div>
  );
}
