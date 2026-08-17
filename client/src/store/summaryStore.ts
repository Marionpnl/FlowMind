import { create } from "zustand";
import apiCall from "@/lib/api";

export interface WeeklyStats {
  focusMinutes: number;
  readingMinutes: number;
  movementMinutes: number;
  morningFocusPercent: number;
  flowdayBlocksDone: number;
  flowdayBlocksPlanned: number;
  notesAdded: number;
  resourcesProgress: { title: string; progress: number }[];
  sparktimeBlocksDone: number;
  sparktimeTitles: string[];
  habits: { name: string; completions: number }[];
}

export interface WeeklyHighlight {
  module: "FlowDay" | "MindShelf" | "SparkTime";
  text: string;
}

export interface WeeklyBilan {
  title: string;
  highlights: WeeklyHighlight[];
  synthesis: string;
  actions: string[];
  stats: WeeklyStats;
}

interface WeeklyStatsResponse {
  success: boolean;
  data: WeeklyStats;
}

interface WeeklyBilanResponse {
  success: boolean;
  data: WeeklyBilan;
}

interface SummaryState {
  fetchWeeklyStats: (weekStart: string) => Promise<WeeklyStats | null>;
  generateWeeklyBilan: (weekStart: string) => Promise<WeeklyBilan | null>;
}

export const useSummaryStore = create<SummaryState>(() => ({
  fetchWeeklyStats: async (weekStart) => {
    try {
      const res = await apiCall<WeeklyStatsResponse>(
        `/api/summary/weekly/stats?weekStart=${weekStart}`,
        { auth: true },
      );
      return res.data;
    } catch {
      return null;
    }
  },

  generateWeeklyBilan: async (weekStart) => {
    try {
      const res = await apiCall<WeeklyBilanResponse>("/api/summary/weekly", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ weekStart }),
      });
      return res.data;
    } catch {
      return null;
    }
  },
}));
