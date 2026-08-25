import { Palette, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import type { ThemeChoice } from "@shared/types";

const THEMES: {
  key: ThemeChoice;
  label: string;
  sub: string;
  comingSoon?: boolean;
}[] = [
  { key: "papier", label: "Papier", sub: "Clair et chaud" },
  { key: "encre", label: "Encre", sub: "Sombre et feutré", comingSoon: true },
  {
    key: "systeme",
    label: "Système",
    sub: "Suit ton appareil",
    comingSoon: true,
  },
];

export default function ApparenceSection() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const theme = user?.theme ?? "papier";
  const preferences = user?.preferences;

  function handleThemeSelect(key: ThemeChoice) {
    if (key !== "papier") return;
    updateProfile({ theme: key });
  }

  function handleToggle(
    key: "animatedTransitions" | "compactDensity",
    value: boolean,
  ) {
    updateProfile({ preferences: { [key]: value } });
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-2xl italic">
        <Palette className="h-4 w-4 text-flowday" />
        Apparence
      </h2>
      <p className="mb-5 text-xs text-muted-foreground">
        L'ambiance visuelle de ton journal
      </p>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {THEMES.map((t) => (
          <button
            key={t.key}
            onClick={() => handleThemeSelect(t.key)}
            disabled={t.comingSoon}
            aria-disabled={t.comingSoon}
            className={cn(
              "relative rounded-xl border p-4 text-left transition-colors",
              t.comingSoon
                ? "cursor-not-allowed border-black/10 bg-cream-secondary opacity-50"
                : "cursor-pointer",
              !t.comingSoon &&
                (theme === t.key
                  ? "border-flowday/30 bg-flowday-bg"
                  : "border-black/10 bg-cream-secondary hover:border-black/20"),
            )}
          >
            <div className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Thème
              {!t.comingSoon && theme === t.key && (
                <Check className="h-3.5 w-3.5 text-flowday" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <p className="text-sm font-medium">{t.label}</p>
              {t.comingSoon && (
                <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                  Bientôt
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t.sub}</p>
          </button>
        ))}
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="pb-1 text-sm font-medium">Animations douces</p>
            <p className="text-xs text-black/60 text-muted-foreground">
              Transitions et apparitions progressives
            </p>
          </div>
          <Switch
            checked={preferences?.animatedTransitions ?? true}
            onCheckedChange={(value) =>
              handleToggle("animatedTransitions", value)
            }
            className="shrink-0 data-checked:bg-flowday"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="pb-1 text-sm font-medium">Densité compacte</p>
            <p className="text-xs text-black/60 text-muted-foreground">
              Réduit les espacements pour voir plus d'un coup
            </p>
          </div>
          <Switch
            checked={preferences?.compactDensity ?? false}
            onCheckedChange={(value) => handleToggle("compactDensity", value)}
            className="shrink-0 data-checked:bg-flowday"
          />
        </div>
      </div>
    </div>
  );
}
