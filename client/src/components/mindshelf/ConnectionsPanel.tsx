import { useEffect, useState } from "react";
import { Link2 } from "lucide-react";
import {
  useResourceStore,
  type ThematicConnection,
} from "@/store/resourceStore";
import type { IResource } from "@shared/types";

interface ConnectionsPanelProps {
  resources: IResource[];
  onSelectResource: (resource: IResource) => void;
}

export default function ConnectionsPanel({
  resources,
  onSelectResource,
}: ConnectionsPanelProps) {
  const fetchConnections = useResourceStore((s) => s.fetchConnections);
  const [connections, setConnections] = useState<ThematicConnection[]>([]);

  useEffect(() => {
    fetchConnections().then((result) => setConnections(result));
  }, [fetchConnections]);

  const resourceById = new Map(resources.map((r) => [r._id, r]));

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wide">
        <Link2 className="h-4.5 w-4.5 text-mindshelf" />
        Connexions thématiques
      </h2>

      {connections.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Pas encore assez de ressources pour trouver des connexions.
        </p>
      ) : (
        <div className="space-y-3">
          {connections.map((c, idx) => {
            const resourceA = resourceById.get(c.resourceIdA);
            const resourceB = resourceById.get(c.resourceIdB);
            if (!resourceA || !resourceB) return null;

            return (
              <div key={idx} className="rounded-xl bg-mindshelf-bg p-4">
                <p className="text-[10px] font-medium uppercase tracking-widest text-mindshelf">
                  {c.theme}
                </p>
                <p className="mt-1.5 text-sm italic">{c.explanation}</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    onClick={() => onSelectResource(resourceA)}
                    className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-mindshelf hover:bg-white/70 cursor-pointer"
                  >
                    {resourceA.title}
                  </button>
                  <button
                    onClick={() => onSelectResource(resourceB)}
                    className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-mindshelf hover:bg-white/70 cursor-pointer"
                  >
                    {resourceB.title}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
