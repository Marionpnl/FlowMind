// ===== USER =====
export interface IUser {
  _id: string;
  email: string;
  name?: string;
  location?: string;
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
  energyScore?: number; // 1-5, filled at the end-of-day review
  endOfDaySummary?: string;
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
  createdAt: Date;
  updatedAt: Date;
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
