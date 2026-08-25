import { Shield } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

function formatExportDate(iso?: string): string {
  if (!iso) return "Jamais";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ConfidentialiteSection() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-2xl italic">
        <Shield className="h-4 w-4 text-accent-danger" />
        Confidentialité
      </h2>
      <p className="mb-5 text-xs text-muted-foreground">
        Ce que FlowMind conserve, et l'accès à tes données
      </p>

      <div>
        <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Dernier export
        </label>
        <p className="mt-1 w-full rounded-lg border border-border bg-cream-secondary px-3 py-2 text-sm">
          {formatExportDate(user?.lastExportAt)}
        </p>
      </div>

      <p className="mt-4 text-xs text-black/50 text-muted-foreground">
        Le partage de données entre modules et la conservation de
        l'historique de lecture se gèrent depuis Intelligence IA
        (« Suggestions transversales » et « Redécouverte du jour »).
      </p>
    </div>
  );
}
