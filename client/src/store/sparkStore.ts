import { create } from "zustand";
import apiCall from "@/lib/api";
import type { ISpark } from "@shared/types";

interface SparksResponse {
  success: boolean;
  data: ISpark[];
}

export interface GenerateSparksFilters {
  maxDuration?: number;
  maxDistance?: number;
  energyLevel?: string;
}

interface SparkState {
  sparks: ISpark[];
  loading: boolean;
  error: string | null;
  fetchSparks: () => Promise<void>;
  generateSparks: (filters?: GenerateSparksFilters) => Promise<void>;
}

export const useSparkStore = create<SparkState>((set, get) => ({
  sparks: [],
  loading: false,
  error: null,

  fetchSparks: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiCall<SparksResponse>("/api/sparks", {
        auth: true,
      });
      set({ sparks: res.data, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Loading error";
      set({ error: message, loading: false });
    }
  },

  generateSparks: async (filters) => {
    set({ loading: true, error: null });
    try {
      const res = await apiCall<SparksResponse>("/api/sparks/generate", {
        method: "POST",
        auth: true,
        body: JSON.stringify(filters ?? {}),
      });
      set({ sparks: [...res.data, ...get().sparks], loading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error generating sparks";
      set({ error: message, loading: false });
    }
  },
}));
