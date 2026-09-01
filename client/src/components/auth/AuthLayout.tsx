import type { FormEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Lock, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MODULES = [
  { label: "FlowDay", desc: "Planifier tes journées", dot: "bg-flowday" },
  { label: "MindShelf", desc: "Lire et noter", dot: "bg-mindshelf" },
  { label: "SparkTime", desc: "T'inspirer", dot: "bg-sparktime" },
];

interface AuthLayoutProps {
  mode: "login" | "register" | "standalone";
  title: string;
  subtitle: string;
  error?: string;
  submitting?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  onSubmit?: (e: FormEvent) => void;
  children: ReactNode;
  footer: ReactNode;
  /** Pas de champs ni de bouton — juste un écran de confirmation. */
  hideForm?: boolean;
}

export default function AuthLayout({
  mode,
  title,
  subtitle,
  error,
  submitting = false,
  submitLabel = "",
  submittingLabel = "",
  onSubmit,
  children,
  footer,
  hideForm = false,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-cream">
      {/* Panneau de marque — masqué en dessous de lg, la page devient
          juste le formulaire centré sur mobile/tablette */}
      <div className="hidden w-1/2 flex-col justify-between border-r border-black/5 bg-cream-secondary p-12 lg:flex">
        <div>
          <Link to="/" className="mb-16 flex items-center gap-2">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-black font-display italic text-white">
              F
              <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-cream-secondary bg-flowday" />
            </div>
            <p className="font-display text-xl italic">FlowMind</p>
          </Link>

          {/* Accroche décorative, pas le vrai titre de page (voir le <h1>
              du panneau formulaire ci-dessous, seul visible sur mobile). */}
          <p className="max-w-md font-display text-4xl italic leading-tight">
            Ta journée, ta bibliothèque et tes envies — au même endroit.
          </p>

          <ul className="mt-10 space-y-3">
            {MODULES.map((m) => (
              <li key={m.label} className="flex items-center gap-2 text-sm">
                <span className={cn("h-2 w-2 rounded-full", m.dot)} />
                <span className="font-medium">{m.label}</span>
                <span className="text-black/50 text-muted-foreground">
                  — {m.desc}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="font-mono text-[10px] text-black/50 tracking-widest text-muted-foreground">
          V2.0 — JUIN 2026
        </p>
      </div>

      {/* Panneau formulaire */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Logo — uniquement visible quand le panneau de marque est masqué */}
          <Link to="/" className="mb-10 flex items-center gap-2 lg:hidden">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-black font-display italic text-white">
              F
              <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-cream bg-flowday" />
            </div>
            <p className="font-display text-xl italic">FlowMind</p>
          </Link>

          {/* Vrai <h1> de la page — visible sur toutes les tailles d'écran,
              contrairement à l'accroche du panneau de marque ci-dessus. */}
          <h1 className="font-display text-3xl italic">{title}</h1>
          <p className="mt-1 text-sm text-black/60 text-muted-foreground">
            {subtitle}
          </p>

          {mode !== "standalone" && (
            <div className="mt-6 flex gap-1 rounded-xl bg-cream-secondary p-1">
              <Link
                to="/login"
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-center text-xs font-medium uppercase tracking-wider transition-colors",
                  mode === "login"
                    ? "bg-white shadow-sm"
                    : "text-black/60 hover:text-foreground",
                )}
              >
                Connexion
              </Link>
              <Link
                to="/register"
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-center text-xs font-medium uppercase tracking-wider transition-colors",
                  mode === "register"
                    ? "bg-white shadow-sm"
                    : "text-black/60 hover:text-foreground",
                )}
              >
                Inscription
              </Link>
            </div>
          )}

          {hideForm ? (
            <div className="mt-6 space-y-4">{children}</div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {error && <p className="text-xs text-accent-danger">{error}</p>}
              {children}
              <Button
                type="submit"
                disabled={submitting}
                className="h-11 w-full gap-1.5 rounded-full bg-[#2B2A28] text-sm text-white hover:bg-[#2B2A28]/90"
              >
                {submitting ? (
                  submittingLabel
                ) : (
                  <>
                    {submitLabel}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {footer}

          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-black/50 text-muted-foreground">
            <Lock className="h-3 w-3" />
            Tes données restent privées.
          </p>
        </div>
      </div>
    </div>
  );
}

interface AuthFieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  Icon: LucideIcon;
  autoComplete?: string;
}

// Id dérivé du label plutôt que passé en prop — un seul champ par label sur
// un formulaire d'auth, jamais deux instances de "Email" sur la même page.
function slugify(label: string): string {
  return `auth-field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function AuthField({
  label,
  type,
  value,
  onChange,
  placeholder,
  Icon,
  autoComplete,
}: AuthFieldProps) {
  const id = slugify(label);
  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs font-medium text-black/60 uppercase tracking-widest text-muted-foreground"
      >
        {label}
      </label>
      <div className="relative mt-1.5">
        <Icon className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-black/40" />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="w-full rounded-full border border-black/10 bg-white py-2.5 pr-4 pl-11 text-sm shadow-sm outline-none focus:border-black/20"
        />
      </div>
    </div>
  );
}
