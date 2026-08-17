import type { LucideIcon } from "lucide-react";

interface ComingSoonSectionProps {
  id: string;
  label: string;
  description: string;
  Icon: LucideIcon;
}

export default function ComingSoonSection({
  id,
  label,
  description,
  Icon,
}: ComingSoonSectionProps) {
  return (
    <div
      id={id}
      className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-6"
    >
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </h2>
      <p className="text-xs text-muted-foreground">
        {description} — bientôt disponible.
      </p>
    </div>
  );
}
