import type { ReactNode } from "react";
import { PanelLeft } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  actions,
}: PageHeaderProps) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleMobileMenu = useUIStore((s) => s.toggleMobileMenu);
  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <header className="flex items-center justify-between gap-x-4 border-b border-black/5 px-4 py-4 sm:px-8 sm:py-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={isMobile ? toggleMobileMenu : toggleSidebar}
          className="shrink-0 rounded-md p-1.5 -m-1.5 text-muted-foreground hover:text-foreground hover:bg-black/5"
          aria-label="Replier/déplier la barre latérale"
        >
          <PanelLeft className="h-4.5 w-4.5 text-black/70" />
        </button>
        <span className="h-6 w-px shrink-0 bg-black/10" />
        <div className="flex min-w-0 flex-col gap-0.5 lg:flex-row lg:items-baseline lg:gap-3">
          {/* Titre de page — un seul <h1> par page, ce composant n'est
              monté qu'une fois par page (voir Dashboard/FlowDay/etc.). */}
          <h1 className="shrink-0 whitespace-nowrap font-display text-xl italic capitalize">
            {title}
          </h1>
          {subtitle && (
            <span className="truncate text-[11px] text-black/70 text-muted-foreground lg:text-sm">
              {subtitle}
            </span>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-3">{actions}</div>
      )}
    </header>
  );
}
