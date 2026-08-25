import { useState } from "react";
import { User, Bell, Sparkles, Palette, Shield, Cloud } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import SettingsNav from "@/components/settings/SettingsNav";
import ProfileSection from "@/components/settings/ProfileSection";
import AIPreferencesSection from "@/components/settings/AIPreferencesSection";
import NotificationsSection from "@/components/settings/NotificationsSection";
import ModulesSection from "@/components/settings/ModulesSection";
import ApparenceSection from "@/components/settings/ApparenceSection";
import ConfidentialiteSection from "@/components/settings/ConfidentialiteSection";
import DangerZoneSection from "@/components/settings/DangerZoneSection";
import ComingSoonSection from "@/components/settings/ComingSoonSection";

const NAV_ITEMS = [
  {
    id: "profile",
    label: "Profil",
    Icon: User,
    iconBg: "bg-flowday-bg",
    iconColor: "text-flowday",
  },
  {
    id: "notifications",
    label: "Notifications",
    Icon: Bell,
    iconBg: "bg-sparktime-bg",
    iconColor: "text-sparktime",
  },
  {
    id: "ai",
    label: "Intelligence IA",
    Icon: Sparkles,
    iconBg: "bg-mindshelf-bg",
    iconColor: "text-mindshelf",
  },
  {
    id: "apparence",
    label: "Apparence",
    Icon: Palette,
    iconBg: "bg-flowday-bg",
    iconColor: "text-flowday",
  },
  {
    id: "confidentialite",
    label: "Confidentialité",
    Icon: Shield,
    iconBg: "bg-accent-danger-bg",
    iconColor: "text-accent-danger",
  },
  {
    id: "synchronisation",
    label: "Synchronisation",
    Icon: Cloud,
    iconBg: "bg-mindshelf-bg",
    iconColor: "text-mindshelf",
  },
];

export default function Settings() {
  const [active, setActive] = useState("profile");

  return (
    <div className="min-h-screen">
      <PageHeader title="Paramètres" subtitle="Personnalise ton FlowMind" />

      <main className="grid grid-cols-1 gap-5 px-4 py-6 sm:px-8 lg:grid-cols-[220px_1fr]">
        <SettingsNav items={NAV_ITEMS} active={active} onSelect={setActive} />

        <div className="space-y-5">
          {active === "profile" && (
            <>
              <ProfileSection />
              <ModulesSection />
            </>
          )}

          {active === "notifications" && <NotificationsSection />}

          {active === "ai" && <AIPreferencesSection />}

          {active === "apparence" && <ApparenceSection />}

          {active === "confidentialite" && (
            <>
              <ConfidentialiteSection />
              <DangerZoneSection />
            </>
          )}

          {active === "synchronisation" && (
            <ComingSoonSection
              id="synchronisation"
              label="Synchronisation"
              description="Connexion avec Google Calendar et d'autres outils"
              Icon={Cloud}
            />
          )}
        </div>
      </main>
    </div>
  );
}
