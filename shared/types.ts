// ===== USER =====
export interface IUser {
  _id: string;
  email: string;
  name?: string;
  location?: string;
}

// ===== HABITS =====
export interface IHabit {
  _id: string;
  userId: string;
  name: string; // ex: "Sport", "Lecture", "Code"
  emoji: string; // ex: "🏃‍♂️", "📚", "💻"
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

// ===== FLOWDAY =====
export type PlanView = "day" | "week" | "month";
export type DisplayMode = "list" | "calendar";

export interface AIBlock {
  time: string;
  task: string;
  emoji: string;
  type: "focus" | "break" | "habit" | "spark" | "other";
  sparkId?: string;
}
