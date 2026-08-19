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
import { useMediaQuery } from "@/lib/useMediaQuery";
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

  const collapsed = isMobile ? !mobileMenuOpen : sidebarCollapsed;
  // Mobile's collapsed rail is icon-only real estate — narrower and with
  // smaller icons than desktop's collapsed state, which stays roomier.
  const mobileCollapsedRail = isMobile && collapsed;
  const widthClass = collapsed
    ? isMobile
      ? "w-11 px-1.5"
      : "w-20 px-5"
    : "w-64 px-5";

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
          "flex h-screen flex-col justify-between border-r border-black/5 bg-cream-secondary pt-7 pb-5 transition-all duration-200",
          isMobile && mobileMenuOpen && "fixed inset-y-0 left-0 z-50 shadow-xl",
          widthClass,
        )}
      >
        <div>
          {/* Logo */}
          <Link
            to="/"
            className={cn(
              "mb-8 flex items-center gap-2",
              collapsed ? "justify-center" : "",
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center rounded-xl bg-black font-display italic text-white",
                mobileCollapsedRail ? "h-7 w-7 text-sm" : "h-10 w-10",
              )}
            >
              F
            </div>
            {!collapsed && (
              <div>
                <p className="font-display text-2xl italic leading-none">
                  FlowMind
                </p>
                <p className="pt-1 font-mono text-[10px] text-black/60 tracking-widest text-muted-foreground">
                  V2.0 · JUIN 2026
                </p>
              </div>
            )}
          </Link>

          {/* Modules */}
          {!collapsed && (
            <p className="mb-2 text-xs text-black/65 font-medium uppercase tracking-widest text-muted-foreground">
              Modules
            </p>
          )}
          <nav className="mb-8 space-y-1">
            {MODULE_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                    collapsed &&
                      (mobileCollapsedRail
                        ? "justify-center px-1"
                        : "justify-center px-2"),
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
                        "h-4 w-4 text-black/70",
                        isActive ? link.textClass : "",
                        mobileCollapsedRail && "h-3 w-3",
                      )}
                    />
                    {!collapsed && (
                      <span className="flex flex-col">
                        <span className="flex font-medium items-center gap-2">
                          {link.label}
                        </span>
                        <span className="text-xs text-black/70 text-muted-foreground">
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
            <p className="mb-2 text-xs text-black/65 font-medium uppercase tracking-widest text-muted-foreground">
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
                    collapsed &&
                      (mobileCollapsedRail
                        ? "justify-center px-1"
                        : "justify-center px-2"),
                    isActive
                      ? "bg-white font-medium shadow-sm"
                      : "text-muted-foreground hover:bg-white/60",
                  )
                }
              >
                <Icon
                  className={cn("h-4 w-4", mobileCollapsedRail && "h-3 w-3")}
                />
                {!collapsed && label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Utilisateur */}
        <div className="space-y-3">
          {!collapsed ? (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex justify-between">
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
            <div
              className={cn(
                "flex flex-col items-center rounded-2xl bg-white shadow-sm",
                mobileCollapsedRail ? "gap-2 p-2" : "gap-3 p-3",
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center rounded-full bg-sparktime-bg font-medium text-sparktime",
                  mobileCollapsedRail ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm",
                )}
                title={user?.name}
              >
                {user?.name?.[0] ?? "?"}
              </div>
              <button
                onClick={logout}
                className="text-muted-foreground hover:text-accent-danger"
                aria-label="Se déconnecter"
              >
                <LogOut
                  className={cn("h-4 w-4", mobileCollapsedRail && "h-3 w-3")}
                />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
