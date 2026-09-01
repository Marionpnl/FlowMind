import { useEffect, useState } from "react";
import { Link2 } from "lucide-react";
import { useResourceStore } from "@/store/resourceStore";
import { useAuthStore } from "@/store/authStore";
import type { IResource, ThematicConnection } from "@shared/types";

// Pas de stockage serveur pour les connexions elles-mêmes (recalculées à la
// demande, jamais persistées comme donnée de vérité) — mais le *dernier
// résultat* est mémorisé sur le compte (GET/POST /api/resources/connections)
// pour éviter de relancer l'IA à chaque retour sur MindShelf, et rester
// identique sur tous les appareils de l'utilisatrice. 12h ≈ 2 rechargements
// max par jour pour un usage normal.
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

interface ConnectionsPanelProps {
  resources: IResource[];
  onSelectResource: (resource: IResource) => void;
}

export default function ConnectionsPanel({
  resources,
  onSelectResource,
}: ConnectionsPanelProps) {
  const fetchConnections = useResourceStore((s) => s.fetchConnections);
  const fetchConnectionsCache = useResourceStore(
    (s) => s.fetchConnectionsCache,
  );
  const userId = useAuthStore((s) => s.user?._id);
  const [connections, setConnections] = useState<ThematicConnection[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetchConnectionsCache().then((cached) => {
      if (cached && Date.now() - cached.generatedAt < CACHE_TTL_MS) {
        setConnections(cached.data);
        return;
      }
      fetchConnections().then((result) => setConnections(result));
    });
  }, [fetchConnections, fetchConnectionsCache, userId]);

  const resourceById = new Map(resources.map((r) => [r._id, r]));

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide">
          <Link2 className="h-4.5 w-4.5 text-mindshelf" />
          Connexions thématiques
        </h2>
        <span className="font-mono text-xs text-black/60 text-muted-foreground">
          {connections.length}
        </span>
      </div>

      {connections.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Pas encore assez de ressources pour trouver des connexions.
        </p>
      ) : (
        <div className="space-y-2.5">
          {connections.map((c, idx) => {
            const resourceA = resourceById.get(c.resourceIdA);
            const resourceB = resourceById.get(c.resourceIdB);
            if (!resourceA || !resourceB) return null;

            return (
              <div key={idx} className="rounded-xl bg-cream-secondary p-4">
                <p className="text-[10px] font-medium uppercase tracking-widest text-mindshelf">
                  {c.theme}
                </p>
                <p className="mt-1.5 text-sm font-medium">
                  <button
                    onClick={() => onSelectResource(resourceA)}
                    className="hover:underline cursor-pointer"
                  >
                    {resourceA.title}
                  </button>
                  <span className="mx-1.5 text-black/30">↔</span>
                  <button
                    onClick={() => onSelectResource(resourceB)}
                    className="hover:underline cursor-pointer"
                  >
                    {resourceB.title}
                  </button>
                </p>
                <p className="mt-1.5 text-xs text-black/60 text-muted-foreground">
                  {c.explanation}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
