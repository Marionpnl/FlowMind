import { useState } from "react";
import { useAuthStore } from "@/store/authStore";

export default function ProfileSection() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [name, setName] = useState(user?.name ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [timezone, setTimezone] = useState(user?.timezone ?? "Europe/Zurich");
  const [language, setLanguage] = useState(user?.language ?? "Français");

  function handleNameBlur() {
    if (name.trim() && name !== (user?.name ?? "")) {
      updateProfile({ name: name.trim() });
    }
  }
  function handleLocationBlur() {
    if (location.trim() && location !== (user?.location ?? "")) {
      updateProfile({ location: location.trim() });
    }
  }
  function handleTimezoneBlur() {
    if (timezone.trim() && timezone !== (user?.timezone ?? "")) {
      updateProfile({ timezone: timezone.trim() });
    }
  }
  function handleLanguageBlur() {
    if (language.trim() && language !== (user?.language ?? "")) {
      updateProfile({ language: language.trim() });
    }
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <h2 className="mb-1 font-display text-2xl italic">Profil</h2>
      <p className="mb-5 text-xs text-black/70 text-muted-foreground">
        Les infos que FlowMind utilise pour te connaître
      </p>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sparktime-bg text-xl font-medium text-sparktime">
          {user?.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-black/70 text-muted-foreground">
            {user?.email}
            {user?.location ? ` · ${user.location}` : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="profile-name"
            className="text-xs text-black/70 font-medium uppercase tracking-widest text-muted-foreground"
          >
            Prénom
          </label>
          <input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            className="mt-1 w-full rounded-lg border border-border bg-cream-secondary px-3 py-2 text-sm outline-none focus-visible:border-black/30 focus-visible:ring-2 focus-visible:ring-black/15"
          />
        </div>
        <div>
          <label
            htmlFor="profile-timezone"
            className="text-xs text-black/70 font-medium uppercase tracking-widest text-muted-foreground"
          >
            Fuseau horaire
          </label>
          <input
            id="profile-timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            onBlur={handleTimezoneBlur}
            className="mt-1 w-full rounded-lg border border-border bg-cream-secondary px-3 py-2 text-sm outline-none focus-visible:border-black/30 focus-visible:ring-2 focus-visible:ring-black/15"
          />
        </div>
        <div>
          <label
            htmlFor="profile-language"
            className="text-xs text-black/70 font-medium uppercase tracking-widest text-muted-foreground"
          >
            Langue
          </label>
          <input
            id="profile-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            onBlur={handleLanguageBlur}
            className="mt-1 w-full rounded-lg border border-border bg-cream-secondary px-3 py-2 text-sm outline-none focus-visible:border-black/30 focus-visible:ring-2 focus-visible:ring-black/15"
          />
        </div>
        <div>
          <label
            htmlFor="profile-location"
            className="text-xs text-black/70 font-medium uppercase tracking-widest text-muted-foreground"
          >
            Ville
          </label>
          <input
            id="profile-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onBlur={handleLocationBlur}
            className="mt-1 w-full rounded-lg border border-border bg-cream-secondary px-3 py-2 text-sm outline-none focus-visible:border-black/30 focus-visible:ring-2 focus-visible:ring-black/15"
          />
        </div>
      </div>
    </div>
  );
}
