import { useState } from "react";
import { Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/store/authStore";

const TOGGLES: {
  key: "readingHistory" | "anonymousUsage" | "crossModuleDataSharing";
  label: string;
  description: string;
}[] = [
  {
    key: "readingHistory",
    label: "Historique des lectures",
    description: "Garder les citations et notes pour la redécouverte",
  },
  {
    key: "anonymousUsage",
    label: "Analyse d'usage anonyme",
    description: "Aide à améliorer les suggestions",
  },
  {
    key: "crossModuleDataSharing",
    label: "Partage entre modules",
    description: "MindShelf et SparkTime peuvent lire ton planning",
  },
];

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
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const preferences = user?.preferences;

  const [retention, setRetention] = useState(
    String(preferences?.dataRetentionMonths ?? 12),
  );

  function handleToggle(
    key: "readingHistory" | "anonymousUsage" | "crossModuleDataSharing",
    value: boolean,
  ) {
    updateProfile({ preferences: { [key]: value } });
  }

  function handleRetentionBlur() {
    const months = Number(retention);
    if (months > 0 && months !== preferences?.dataRetentionMonths) {
      updateProfile({ preferences: { dataRetentionMonths: months } });
    }
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-2xl italic">
        <Shield className="h-4 w-4 text-accent-danger" />
        Confidentialité
      </h2>
      <p className="mb-5 text-xs text-muted-foreground">
        Ce que FlowMind conserve, et pour combien de temps
      </p>

      <div className="mb-6 space-y-5">
        {TOGGLES.map((t) => (
          <div key={t.key} className="flex items-center justify-between gap-4">
            <div>
              <p className="pb-1 text-sm font-medium">{t.label}</p>
              <p className="text-xs text-black/60 text-muted-foreground">
                {t.description}
              </p>
            </div>
            <Switch
              checked={preferences?.[t.key] ?? true}
              onCheckedChange={(value) => handleToggle(t.key, value)}
              className="shrink-0 data-checked:bg-flowday"
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Conservation des données (mois)
          </label>
          <input
            value={retention}
            onChange={(e) => setRetention(e.target.value)}
            onBlur={handleRetentionBlur}
            className="mt-1 w-full rounded-lg border border-border bg-cream-secondary px-3 py-2 text-sm outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Dernier export
          </label>
          <p className="mt-1 w-full rounded-lg border border-border bg-cream-secondary px-3 py-2 text-sm">
            {formatExportDate(user?.lastExportAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
