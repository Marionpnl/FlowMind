import { create } from "zustand";
import type { IHabit } from "@shared/types";
import apiCall from "../lib/api";

interface HabitResponse {
  success: boolean;
  data: IHabit[];
}

interface SingleHabitResponse {
  success: boolean;
  data: IHabit;
}

interface HabitState {
  habits: IHabit[];
  loading: boolean;
  error: string | null;
  fetchHabits: () => Promise<void>;
  addHabit: (name: string, emoji?: string) => Promise<void>;
  toggleCheck: (id: string, date?: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  loading: false,
  error: null,

  // Get all user habits
  fetchHabits: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiCall<HabitResponse>("/api/habits", { auth: true });
      set({ habits: res.data, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Loading error";
      set({ error: message, loading: false });
    }
  },

  // Add a new habit
  addHabit: async (name: string, emoji = "⚡") => {
    set({ error: null });
    try {
      const res = await apiCall<SingleHabitResponse>("/api/habits", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ name, emoji }),
      });
      set({ habits: [res.data, ...get().habits] });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error while adding";
      set({ error: message });
    }
  },

  // Check/Uncheck a habit (Check-in 1-clic)
  toggleCheck: async (id: string, date?: string) => {
    const targetDate = date || new Date().toISOString().split("T")[0];

    // Update optimistically in the interface (immediate reaction)
    const previousHabits = get().habits;
    set({
      habits: previousHabits.map((habit) => {
        if (habit._id === id) {
          const exists = habit.completedDates.includes(targetDate);
          const updatedDates = exists
            ? habit.completedDates.filter((d) => d !== targetDate)
            : [...habit.completedDates, targetDate];
          return { ...habit, completedDates: updatedDates };
        }
        return habit;
      }),
    });

    // Synchronisation with the server
    try {
      await apiCall<SingleHabitResponse>(`/api/habits/${id}/check`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ date: targetDate }),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Synchronization error";
      // If the server call fails, revert to the previous state
      set({ habits: previousHabits, error: message });
    }
  },

  // Delete a habit
  deleteHabit: async (id: string) => {
    const previousHabits = get().habits;
    set({ habits: previousHabits.filter((h) => h._id !== id) });

    try {
      await apiCall(`/api/habits/${id}`, {
        method: "DELETE",
        auth: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Deletion error";
      set({ habits: previousHabits, error: message });
    }
  },
}));
