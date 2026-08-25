import { Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/store/authStore";

export default function NotificationsSection() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const preferences = user?.preferences;

  function handleToggle(value: boolean) {
    updateProfile({ preferences: { dailyEmailSummary: value } });
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-2xl italic">
        <Bell className="h-4 w-4 text-sparktime" />
        Notifications
      </h2>
      <p className="mb-5 text-xs text-muted-foreground">
        Alertes push et par e-mail pour tes habitudes et ton planning
      </p>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="pb-1 text-sm font-medium">
            Résumé quotidien par e-mail
          </p>
          <p className="text-xs text-black/60 text-muted-foreground">
            Reçois le bilan de ta journée à 21h, heure de ton fuseau
          </p>
        </div>
        <Switch
          checked={preferences?.dailyEmailSummary ?? false}
          onCheckedChange={handleToggle}
          className="shrink-0 data-checked:bg-flowday"
        />
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 opacity-50">
        <div>
          <p className="text-sm font-medium">Notifications push</p>
          <p className="text-xs text-muted-foreground">
            Alertes directes sur ton appareil — bientôt disponible
          </p>
        </div>
        <Switch checked={false} disabled className="shrink-0" />
      </div>
    </div>
  );
}
