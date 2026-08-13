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
