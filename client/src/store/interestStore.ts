import { create } from "zustand";
import apiCall from "@/lib/api";
import type { IInterest } from "@shared/types";

interface InterestsResponse {
  success: boolean;
  data: IInterest[];
}

interface InterestResponse {
  success: boolean;
  data: IInterest;
}

interface DetectedInterest {
  name: string;
  emoji: string;
  category?: string;
}

interface DetectResponse {
  success: boolean;
  data: DetectedInterest[];
}

interface CreateInterestInput {
  name: string;
  emoji?: string;
  category?: string;
  importance?: number;
  source?: "manual" | "ai";
}

interface InterestState {
  interests: IInterest[];
  loading: boolean;
  error: string | null;
  fetchInterests: () => Promise<void>;
  addInterest: (data: CreateInterestInput) => Promise<IInterest | null>;
  updateInterest: (
    id: string,
    updates: Partial<
      Pick<IInterest, "name" | "emoji" | "category" | "importance">
    >,
  ) => Promise<void>;
  deleteInterest: (id: string) => Promise<void>;
  detectInterests: () => Promise<DetectedInterest[]>;
}

export const useInterestStore = create<InterestState>((set, get) => ({
  interests: [],
  loading: false,
  error: null,

  fetchInterests: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiCall<InterestsResponse>("/api/interests", {
        auth: true,
      });
      set({ interests: res.data, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Loading error";
      set({ error: message, loading: false });
    }
  },

  addInterest: async (data) => {
    set({ error: null });
    try {
      const res = await apiCall<InterestResponse>("/api/interests", {
        method: "POST",
        auth: true,
        body: JSON.stringify(data),
      });
      set({ interests: [res.data, ...get().interests] });
      return res.data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error adding interest";
      set({ error: message });
      return null;
    }
  },

  updateInterest: async (id, updates) => {
    const previousInterests = get().interests;
    set({
      interests: previousInterests.map((i) =>
        i._id === id ? { ...i, ...updates } : i,
      ),
    });

    try {
      const res = await apiCall<InterestResponse>(`/api/interests/${id}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify(updates),
      });
      set({
        interests: get().interests.map((i) => (i._id === id ? res.data : i)),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update error";
      set({ interests: previousInterests, error: message });
    }
  },

  deleteInterest: async (id) => {
    const previousInterests = get().interests;
    set({ interests: previousInterests.filter((i) => i._id !== id) });

    try {
      await apiCall(`/api/interests/${id}`, { method: "DELETE", auth: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete error";
      set({ interests: previousInterests, error: message });
    }
  },

  detectInterests: async () => {
    try {
      const res = await apiCall<DetectResponse>("/api/interests/detect", {
        method: "POST",
        auth: true,
      });
      return res.data;
    } catch {
      return [];
    }
  },
}));
