import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SettingsNavItem {
  id: string;
  label: string;
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

interface SettingsNavProps {
  items: SettingsNavItem[];
  active: string;
  onSelect: (id: string) => void;
}

export default function SettingsNav({
  items,
  active,
  onSelect,
}: SettingsNavProps) {
  return (
    <nav className="h-fit space-y-1 ">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors cursor-pointer",
            active === item.id
              ? "bg-white font-medium border border-black/5"
              : "text-muted-foreground hover:bg-cream-secondary/60",
          )}
        >
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
              item.iconBg,
            )}
          >
            <item.Icon className={cn("h-3.5 w-3.5", item.iconColor)} />
          </span>
          <span className="flex-1">{item.label}</span>
          <ChevronRight className="h-3.5 w-3.5 text-black/30" />
        </button>
      ))}
    </nav>
  );
}
