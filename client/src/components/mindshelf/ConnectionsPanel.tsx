import { useEffect, useState } from "react";
import { Link2 } from "lucide-react";
import {
  useResourceStore,
  type ThematicConnection,
} from "@/store/resourceStore";
import { useAuthStore } from "@/store/authStore";
import type { IResource } from "@shared/types";

// Pas de stockage serveur pour les connexions (recalculées à la demande,
// jamais persistées) — on garde juste un cache côté navigateur pour éviter
// de relancer l'IA à chaque retour sur MindShelf. 12h ≈ 2 rechargements
// max par jour pour un usage normal. Clé préfixée par userId pour ne pas
// mélanger le cache entre deux comptes sur le même navigateur.
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

interface ConnectionsCache {
  data: ThematicConnection[];
  timestamp: number;
}

// Un résultat vide n'est jamais gardé (ni écrit, ni fait confiance en
// lecture) — impossible de distinguer ici "vraiment aucune connexion" d'un
// raté ponctuel de l'IA ou d'un quota momentanément atteint, et mettre en
// cache un résultat vide masquerait les vraies connexions pendant 12h. Un
// résultat vide entraîne juste une nouvelle tentative au prochain retour.
function readCache(userId: string): ConnectionsCache | null {
  const raw = localStorage.getItem(`flowmind_connections_cache_${userId}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ConnectionsCache;
    return parsed.data.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(userId: string, data: ThematicConnection[]): void {
  if (data.length === 0) return;
  const cache: ConnectionsCache = { data, timestamp: Date.now() };
  localStorage.setItem(
    `flowmind_connections_cache_${userId}`,
    JSON.stringify(cache),
  );
}

interface ConnectionsPanelProps {
  resources: IResource[];
  onSelectResource: (resource: IResource) => void;
}

export default function ConnectionsPanel({
  resources,
  onSelectResource,
}: ConnectionsPanelProps) {
  const fetchConnections = useResourceStore((s) => s.fetchConnections);
  const userId = useAuthStore((s) => s.user?._id);
  const [connections, setConnections] = useState<ThematicConnection[]>([]);

  useEffect(() => {
    if (!userId) return;
    const cached = readCache(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      void Promise.resolve().then(() => setConnections(cached.data));
      return;
    }
    fetchConnections().then((result) => {
      setConnections(result);
      writeCache(userId, result);
    });
  }, [fetchConnections, userId]);

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
