// ===== USER =====
export type ThemeChoice = "papier" | "encre" | "systeme";

export interface IUserPreferences {
  crossModuleSuggestions: boolean;
  autoGeneratePlan: boolean;
  dailyRediscovery: boolean;
  aiTone: string;
  aiLength: string;
  animatedTransitions: boolean;
  compactDensity: boolean;
  dailyEmailSummary: boolean;
  // Réglages du panneau "Ajuster les suggestions" de SparkTime — persistés
  // sur le compte (pas en localStorage) pour rester identiques sur tous les
  // appareils. sparkMaxDistance reprend l'encodage du slider côté client
  // (valeur brute ; > MAX_FINITE_DISTANCE_KM = illimité, voir lib/sparktime.ts).
  sparkMaxDuration: number;
  sparkMaxDistance: number;
  sparkEnergyIndex: number;
  // Timestamp (ms) jusqu'auquel la suggestion IA MindShelf reste masquée
  // après "Plus tard" (AISuggestionCard).
  readingSuggestionSnoozeUntil: number | null;
}

export interface SuggestedBook {
  title: string;
  author?: string;
  coverUrl?: string;
  isbn?: string;
  reason: string;
  link: string | null;
}

export interface ThematicConnection {
  resourceIdA: string;
  resourceIdB: string;
  theme: string;
  explanation: string;
}

export interface IUser {
  _id: string;
  email: string;
  name?: string;
  location?: string;
  timezone?: string;
  language?: string;
  theme?: ThemeChoice;
  lastExportAt?: string;
  preferences?: IUserPreferences;
  // Données (pas des réglages) mémorisées pour rester cohérentes entre
  // appareils — les événements/connexions/suggestions eux-mêmes restent
  // recalculés à la demande (voir Décisions dans CLAUDE.md), seul ce qui a
  // été explicitement masqué ou généré est conservé ici.
  dismissedLocalEventIds?: string[];
  bookSuggestions?: SuggestedBook[];
  connectionsCache?: {
    data: ThematicConnection[];
    generatedAt: number;
  };
}

// ===== FLOWDAY =====

export type PlanView = "day" | "week" | "month";
export type DisplayMode = "list" | "calendar";

export interface DayPlanBlock {
  id: string;
  time: string; // ex: "09:00"
  title: string;
  subtitle?: string;
  duration: number; // in minutes
  module: HabitModule; // use the same type as for habits
  done: boolean;
  sparkId?: string; // if the block comes from a SparkTime suggestion
}

export interface IDayPlan {
  _id: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  userInput?: string; // free text describing the day, sent to the AI
  blocks: DayPlanBlock[];
  endOfDaySummary?: string; // AI-generated evocative headline for the day
  endOfDayInsight?: string; // AI-generated productivity pattern + suggestion for tomorrow
  endOfDayBlocksSignature?: string; // fingerprint of blocks (id:done) at generation time, to detect staleness
  createdAt: Date;
  updatedAt: Date;
}

// ===== HABITS =====

export type HabitModule = "FlowDay" | "MindShelf" | "SparkTime";
export interface IHabit {
  _id: string;
  userId: string;
  name: string; // ex: "Sport", "Lecture", "Code"
  emoji: string; // ex: "🏃‍♂️", "📚", "💻"
  goal?: string;
  module: HabitModule;
  completedDates: string[]; // Array of date strings "YYYY-MM-DD"
  createdAt: Date;
  updatedAt: Date;
}

// ===== SPARKS (SparkTime) =====
export interface IInterest {
  _id: string;
  userId: string;
  name: string;
  emoji: string;
  category?: string;
  importance: number;
  source: "manual" | "ai";
  createdAt: Date;
  updatedAt: Date;
}

export interface ISpark {
  _id: string;
  userId: string;
  title: string;
  description: string;
  emoji: string;
  duration: number;
  interestName: string;
  category?: string;
  detail?: string; // free-text line ex: "8 km · centre-ville", "niveau facile"
  energyLevel?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Pas de _id/userId/createdAt/updatedAt : jamais persisté en base (recalculé
// à la demande auprès de Ticketmaster à chaque appel, comme la météo).
export interface ILocalEvent {
  id: string; // id Ticketmaster, pas un ObjectId Mongo
  title: string;
  date: string; // "YYYY-MM-DD", date réelle de l'événement
  venue?: string;
  city?: string;
  segment?: string; // ex: "Sports", "Music"
  genre?: string;
  subGenre?: string;
  url: string; // fiche officielle Ticketmaster
}

// ===== MINDSHELF =====
export type ResourceType = "book" | "article" | "video" | "podcast";
export type ResourceStatus = "to-read" | "in-progress" | "done";

export interface INote {
  id: string;
  content: string;
  isQuote: boolean; // true = memorable quote, false = free note
  page?: string; // optional page number, pertinent for quotes or notes from books
  createdAt: Date;
}
export interface IResource {
  _id: string;
  userId: string;
  type: ResourceType;
  title: string;
  author?: string;
  coverUrl?: string;
  isbn?: string;
  status: ResourceStatus;
  rating?: number; // 0-5
  progress: number; // 0-100
  currentPosition?: string; // ex: "ch. 6", "p. 142", "12:30"
  tags: string[];
  notes: INote[];
  createdAt: Date;
  updatedAt: Date;
}
