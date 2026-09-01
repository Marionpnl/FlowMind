import { useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Calendar,
  Settings,
  LogOut,
  Leaf,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

const MODULE_LINKS = [
  {
    to: "/flowday",
    label: "FlowDay",
    sub: "Planifier",
    colorClass: "bg-flowday",
    textClass: "text-flowday",
    Icon: Leaf,
  },
  {
    to: "/mindshelf",
    label: "MindShelf",
    sub: "Lire & noter",
    colorClass: "bg-mindshelf",
    textClass: "text-mindshelf",
    Icon: BookOpen,
  },
  {
    to: "/sparktime",
    label: "SparkTime",
    sub: "S'inspirer",
    colorClass: "bg-sparktime",
    textClass: "text-sparktime",
    Icon: Sparkles,
  },
];

const SPACE_LINKS = [
  { to: "/calendar", label: "Calendrier", Icon: Calendar },
  { to: "/settings", label: "Paramètres", Icon: Settings },
];

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const mobileMenuOpen = useUIStore((s) => s.mobileMenuOpen);
  const closeMobileMenu = useUIStore((s) => s.closeMobileMenu);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const location = useLocation();

  // Close the mobile drawer whenever the route changes (nav link clicked)
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname, closeMobileMenu]);

  // Ce tiroir mobile est un overlay fait main (pas le composant Dialog
  // partagé — c'est un menu de navigation, pas une modale), donc Échap ne le
  // ferme pas automatiquement comme pour les vraies modales : à ajouter
  // explicitement.
  useEffect(() => {
    if (!isMobile || !mobileMenuOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeMobileMenu();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, mobileMenuOpen, closeMobileMenu]);

  const collapsed = isMobile ? !mobileMenuOpen : sidebarCollapsed;

  // Sur mobile, pas de rail d'icônes permanent : la sidebar n'existe qu'en
  // overlay plein via le bouton du PageHeader (mobileMenuOpen). Un rail
  // replié en continu volerait de la largeur précieuse à l'écran.
  if (isMobile && !mobileMenuOpen) return null;

  // Plus de rail replié sur mobile (early return ci-dessus) : `collapsed`
  // ne peut désormais être vrai qu'en desktop, où la sidebar reste roomier.
  const widthClass = collapsed ? "w-20 px-5" : "w-64 px-5";

  return (
    <>
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "flex h-screen flex-col justify-between border-r border-black/5 bg-cream-secondary pt-7 pb-5 transition-all duration-400",
          isMobile && mobileMenuOpen && "fixed inset-y-0 left-0 z-50 shadow-xl",
          widthClass,
        )}
      >
        <div>
          {/* Logo */}
          <Link
            to="/"
            className={cn(
              "mb-8 flex items-center",
              collapsed ? "justify-center" : "gap-2",
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black font-display italic text-white">
              F
            </div>
            <div
              className={cn(
                "grid transition-all duration-400",
                collapsed
                  ? "grid-cols-[0fr] grid-rows-[0fr] opacity-0"
                  : "grid-cols-[1fr] grid-rows-[1fr] opacity-100",
              )}
            >
              <div className="min-h-0 min-w-0 overflow-hidden whitespace-nowrap">
                <p className="font-display text-2xl italic leading-none">
                  FlowMind
                </p>
                <p className="pt-1 font-mono text-[10px] text-black/60 tracking-widest text-muted-foreground">
                  V2.0 · JUIN 2026
                </p>
              </div>
            </div>
          </Link>

          {/* Modules */}
          <div
            className={cn(
              "grid transition-all duration-400",
              collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
            )}
          >
            <p className="mb-2 min-h-0 overflow-hidden whitespace-nowrap text-xs text-black/65 font-medium uppercase tracking-widest text-muted-foreground">
              Modules
            </p>
          </div>
          <nav className="mb-8 space-y-1">
            {MODULE_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "relative flex items-center rounded-xl px-3 py-2 text-sm transition-colors",
                    collapsed ? "justify-center px-2" : "gap-3",
                    isActive
                      ? "bg-white shadow-sm"
                      : "text-muted-foreground hover:bg-white/60",
                  )
                }
                title={collapsed ? link.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        className={cn(
                          "absolute left-0 top-1/2 h-5 sm:h-7 w-0.5 sm:w-1 -translate-y-1/2 rounded-r-md",
                          link.colorClass,
                        )}
                      />
                    )}
                    <link.Icon
                      className={cn(
                        "h-4 w-4 shrink-0 text-black/70",
                        isActive ? link.textClass : "",
                      )}
                    />
                    <span
                      className={cn(
                        "grid transition-all duration-400",
                        collapsed
                          ? "grid-cols-[0fr] grid-rows-[0fr] opacity-0"
                          : "grid-cols-[1fr] grid-rows-[1fr] opacity-100",
                      )}
                    >
                      <span className="flex min-h-0 min-w-0 flex-col overflow-hidden whitespace-nowrap">
                        <span className="flex font-medium items-center gap-2">
                          {link.label}
                        </span>
                        <span className="text-xs text-black/70 text-muted-foreground">
                          {link.sub}
                        </span>
                      </span>
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Espace */}
          <div
            className={cn(
              "grid transition-all duration-400",
              collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
            )}
          >
            <p className="mb-2 min-h-0 overflow-hidden whitespace-nowrap text-xs text-black/65 font-medium uppercase tracking-widest text-muted-foreground">
              Espace
            </p>
          </div>
          <nav className="space-y-1">
            {SPACE_LINKS.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
                    collapsed ? "justify-center px-2" : "gap-2",
                    isActive
                      ? "bg-white font-medium shadow-sm"
                      : "text-muted-foreground hover:bg-white/60",
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span
                  className={cn(
                    "grid transition-all duration-400",
                    collapsed
                      ? "grid-cols-[0fr] opacity-0"
                      : "grid-cols-[1fr] opacity-100",
                  )}
                >
                  <span className="min-w-0 overflow-hidden whitespace-nowrap">
                    {label}
                  </span>
                </span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Utilisateur */}
        <div className="space-y-3">
          {!collapsed ? (
            <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sparktime-bg text-sm font-medium text-sparktime">
                    {user?.name?.[0] ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium leading-none">
                      {user?.name}
                    </p>
                    {user?.location && (
                      <p className="truncate text-xs text-muted-foreground">
                        {user.location}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="shrink-0 rounded-md p-1.5 -m-1.5 text-muted-foreground hover:bg-black/5 hover:text-accent-danger"
                  aria-label="Se déconnecter"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-sparktime-bg text-sm font-medium text-sparktime"
                title={user?.name}
              >
                {user?.name?.[0] ?? "?"}
              </div>
              <button
                onClick={logout}
                className="rounded-md p-1.5 -m-1.5 text-muted-foreground hover:bg-black/5 hover:text-accent-danger"
                aria-label="Se déconnecter"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
