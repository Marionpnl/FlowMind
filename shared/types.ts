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
export interface ISpark {
  _id: string;
  userId: string;
  title: string;
  description: string;
  emoji: string;
  duration: number;
  interestName: string;
}

// ===== MINDSHELF =====
export type ResourceType = "book" | "article" | "video" | "podcast";
export type ResourceStatus = "to-read" | "in-progress" | "done";

export interface INote {
  id: string;
  content: string;
  isQuote: boolean; // true = memorable quote, false = free note
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
  tags: string[];
  notes: INote[];
  createdAt: Date;
  updatedAt: Date;
}
