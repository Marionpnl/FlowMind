// Données fixes pour le développement et les tests

import type { ModuleName } from "./moduleStyles";

export interface PlanningBlock {
  id: string;
  time: string;
  title: string;
  subtitle: string;
  module: ModuleName;
}

export const todayBlocks: PlanningBlock[] = [
  {
    id: "1",
    time: "07:30",
    title: "Méditation guidée",
    subtitle: "10 min · réveil en douceur",
    module: "FlowDay",
  },
  {
    id: "2",
    time: "09:00",
    title: "Travail profond - TypeScript",
    subtitle: "Refactor du module d'authentification",
    module: "FlowDay",
  },
  {
    id: "3",
    time: "11:30",
    title: "Pause respiration",
    subtitle: "Suggéré par SparkTime",
    module: "SparkTime",
  },
  {
    id: "4",
    time: "14:00",
    title: "Lecture - Refactoring, ch. 6",
    subtitle: "Notes dans MindShelf",
    module: "MindShelf",
  },
  {
    id: "5",
    time: "18:30",
    title: "Boucle de course autour du lac",
    subtitle: "8 km · 45 min · terrain plat",
    module: "SparkTime",
  },
];

export const insight = {
  text: "Tu as beaucoup lu sur TypeScript cette semaine — veux-tu planifier une session de pratique aussi ? Et si tu glissais aussi une sortie course ce soir ?",
};

export interface MindShelfItem {
  id: string;
  title: string;
  author: string;
  progress: number; // 0-100
  chapter: string;
}

export const mindshelfInProgress: MindShelfItem[] = [
  {
    id: "1",
    title: "Refactoring",
    author: "Martin Fowler",
    progress: 62,
    chapter: "ch. 6",
  },
  {
    id: "2",
    title: "Atomic Habits",
    author: "James Clear",
    progress: 34,
    chapter: "ch. 3",
  },
];

export const dailyQuote = {
  text: "La duplication est la racine de tout mal en logiciel.",
  source: "Refactoring, p. 142",
};

export interface SparkSuggestion {
  id: string;
  title: string;
  detail: string;
}

export const sparkSuggestions: SparkSuggestion[] = [
  {
    id: "1",
    title: "Boucle de course autour du lac",
    detail: "8 km · 45 min · terrain plat",
  },
  {
    id: "2",
    title: "Séance YouTube yoga du matin",
    detail: "20 min · classe douce",
  },
  {
    id: "3",
    title: "Café-écriture à La Brûlerie",
    detail: "1h · centre-ville",
  },
];

export const focusStats = {
  deepWorkDuration: "4h15",
  activeBreaks: 2,
};
