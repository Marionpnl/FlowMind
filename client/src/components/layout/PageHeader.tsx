import type { ReactNode } from "react";
import { PanelLeft } from "lucide-react";
import { useUIStore } from "@/store/uiStore";

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

  return (
    <header className="flex items-center justify-between border-b border-black/5 px-8 py-5">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Replier/déplier la barre latérale"
        >
          <PanelLeft className="h-4 w-4 black/70" />
        </button>
        <div className="flex items-baseline gap-3">
          <p className="font-display text-xl italic capitalize p-2">{title}</p>
          {subtitle && (
            <span className="text-sm text-muted-foreground">{subtitle}</span>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
