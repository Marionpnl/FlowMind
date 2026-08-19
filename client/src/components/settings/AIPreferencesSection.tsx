import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/store/authStore";

type BooleanPreferenceKey =
  | "crossModuleSuggestions"
  | "autoGeneratePlan"
  | "dailyRediscovery";

const TOGGLES: {
  key: BooleanPreferenceKey;
  label: string;
  description: string;
}[] = [
  {
    key: "crossModuleSuggestions",
    label: "Suggestions transversales",
    description:
      "L'IA propose des liens entre tes lectures, ton planning et tes activités",
  },
  {
    key: "autoGeneratePlan",
    label: "Génération automatique du planning",
    description:
      "Structure ta journée à partir d'une description en langage naturel",
  },
  {
    key: "dailyRediscovery",
    label: "Redécouverte du jour",
    description: "Une citation de tes lectures passées, chaque matin",
  },
];

export default function AIPreferencesSection() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const preferences = user?.preferences;

  const [tone, setTone] = useState(
    preferences?.aiTone ?? "Calme et encourageant",
  );
  const [length, setLength] = useState(preferences?.aiLength ?? "Concise");

  function handleToggle(key: BooleanPreferenceKey, value: boolean) {
    updateProfile({ preferences: { [key]: value } });
  }

  function handleToneBlur() {
    if (tone.trim() && tone !== (preferences?.aiTone ?? "")) {
      updateProfile({ preferences: { aiTone: tone.trim() } });
    }
  }
  function handleLengthBlur() {
    if (length.trim() && length !== (preferences?.aiLength ?? "")) {
      updateProfile({ preferences: { aiLength: length.trim() } });
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-display text-2xl italic">
          <Sparkles className="h-4 w-4 text-mindshelf" />
          Intelligence IA
        </h2>
        <p className="mb-5 text-xs text-muted-foreground">
          Le niveau d'initiative que tu laisses à FlowMind
        </p>
        <div className="space-y-5">
          {TOGGLES.map((t) => (
            <div
              key={t.key}
              className="flex items-center justify-between gap-4"
            >
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
          <div className="flex items-center justify-between gap-4 opacity-50">
            <div>
              <p className="text-sm font-medium">Résumé quotidien par e-mail</p>
              <p className="text-xs text-muted-foreground">
                Reçois le bilan de ta journée à 21h — bientôt disponible
              </p>
            </div>
            <Switch checked={false} disabled className="shrink-0" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold tracking-wide">
          Ton de l'IA
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Style
            </label>
            <input
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              onBlur={handleToneBlur}
              className="mt-1 w-full rounded-lg border border-border bg-cream-secondary px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Longueur des suggestions
            </label>
            <input
              value={length}
              onChange={(e) => setLength(e.target.value)}
              onBlur={handleLengthBlur}
              className="mt-1 w-full rounded-lg border border-border bg-cream-secondary px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>
      </div>
    </>
  );
}
