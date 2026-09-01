import {
  Dumbbell,
  Palette,
  Heart,
  Users,
  BookOpen,
  Leaf,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export const categoryIcon: Record<string, LucideIcon> = {
  Sport: Dumbbell,
  Créatif: Palette,
  "Bien-être": Heart,
  Social: Users,
  Culture: BookOpen,
  Nature: Leaf,
};

export function getCategoryIcon(category?: string): LucideIcon {
  if (!category) return Sparkles;
  return categoryIcon[category] ?? Sparkles;
}

export const CATEGORIES = Object.keys(categoryIcon);

export const ENERGY_LEVELS = [
  "Basse",
  "Basse-Moyenne",
  "Moyenne",
  "Moyenne-Haute",
  "Haute",
];

// Borne haute "réelle" du slider Distance max — au-delà (un cran de plus,
// voir MAX_DISTANCE_SLIDER_VALUE), le réglage devient "pas de limite" plutôt
// qu'un chiffre. Doit rester cohérent avec MAX_RADIUS_KM côté serveur
// (server/src/routes/localEvents.ts).
export const MAX_FINITE_DISTANCE_KM = 100;
export const MAX_DISTANCE_SLIDER_VALUE = MAX_FINITE_DISTANCE_KM + 1;

export function distanceLabel(value: number): string {
  return value > MAX_FINITE_DISTANCE_KM ? "Pas de limite" : `${value} km`;
}
