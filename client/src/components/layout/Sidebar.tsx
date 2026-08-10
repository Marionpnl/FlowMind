import { NavLink } from "react-router-dom";
import {
  Calendar,
  Settings,
  LogOut,
  Leaf,
  BookOpen,
  Sparkles,
  Flame,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
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
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <aside
      className={cn(
        "flex h-screen flex-col justify-between border-r border-black/5 bg-cream-secondary p-5 transition-all duration-200",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div>
        {/* Logo */}
        <div
          className={cn(
            "mb-8 flex items-center gap-2",
            collapsed ? "justify-center" : "",
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black font-display italic text-white">
            F
          </div>
          {!collapsed && (
            <div>
              <p className="font-display text-2xl italic leading-none">
                FlowMind
              </p>
              <p className="font-mono text-[10px] text-black/80 text-muted-foreground">
                V2.0 · JUIN 2026
              </p>
            </div>
          )}
        </div>

        {/* Modules */}
        {!collapsed && (
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Modules
          </p>
        )}
        <nav className="mb-6 space-y-1">
          {MODULE_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                  collapsed && "justify-center px-2",
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
                        "absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-md",
                        link.colorClass,
                      )}
                    />
                  )}
                  <link.Icon
                    className={cn("h-4 w-4", isActive ? link.textClass : "")}
                  />
                  {!collapsed && (
                    <span className="flex flex-col">
                      <span className="flex font-medium items-center gap-2">
                        {link.label}
                      </span>
                      <span className="text-xs text-black/80 text-muted-foreground">
                        {link.sub}
                      </span>
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Espace */}
        {!collapsed && (
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Espace
          </p>
        )}
        <nav className="space-y-1">
          {SPACE_LINKS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-white font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-white/60",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Streak + utilisateur */}
      <div className="space-y-3">
        {!collapsed ? (
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-black/70">
              <Flame className="mr-2 inline-block h-4 w-4 text-accent-danger" />
              Streak · 12 jours
            </p>
            <div className="flex gap-0.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-6 flex-1 rounded-full bg-flowday" />
              ))}
            </div>

            <div className="flex justify-between pt-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sparktime-bg text-sm font-medium text-sparktime">
                  {user?.name?.[0] ?? "?"}
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">
                    {user?.name}
                  </p>
                  {user?.location && (
                    <p className="text-xs text-muted-foreground">
                      {user.location}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={logout}
                className="text-muted-foreground hover:text-accent-danger"
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
              className="text-muted-foreground hover:text-accent-danger"
              aria-label="Se déconnecter"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
