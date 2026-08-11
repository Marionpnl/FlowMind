import { create } from "zustand";
import apiCall from "@/lib/api";
import type { IDayPlan } from "@shared/types";

interface DayPlanResponse {
  success: boolean;
  data: IDayPlan;
}

interface DayPlanState {
  currentPlan: IDayPlan | null;
  weekPlans: IDayPlan[];
  monthPlans: IDayPlan[];
  loading: boolean;
  generating: boolean;
  error: string | null;
  fetchPlan: (date: string) => Promise<void>;
  fetchWeekPlans: (weekStart: string) => Promise<void>;
  fetchMonthPlans: (year: number, month: number) => Promise<void>;
  generatePlan: (userInput: string, date: string) => Promise<void>;
  toggleBlock: (blockId: string) => Promise<void>;
}

export const useDayPlanStore = create<DayPlanState>((set, get) => ({
  currentPlan: null,
  weekPlans: [],
  monthPlans: [],
  loading: false,
  generating: false,
  error: null,

  fetchPlan: async (date) => {
    set({ loading: true, error: null });
    try {
      const res = await apiCall<DayPlanResponse>(`/api/flowday/${date}`, {
        auth: true,
      });
      set({ currentPlan: res.data, loading: false });
    } catch {
      // Pas d'erreur affichée si c'est juste "pas encore de plan pour ce jour" (404)
      set({ currentPlan: null, loading: false });
    }
  },

  fetchWeekPlans: async (weekStart) => {
    set({ loading: true, error: null });
    try {
      const res = await apiCall<{ success: boolean; data: IDayPlan[] }>(
        `/api/flowday/week/${weekStart}`,
        { auth: true },
      );
      set({ weekPlans: res.data, loading: false });
    } catch {
      set({ weekPlans: [], loading: false });
    }
  },

  fetchMonthPlans: async (year, month) => {
    set({ loading: true, error: null });
    try {
      const res = await apiCall<{ success: boolean; data: IDayPlan[] }>(
        `/api/flowday/month/${year}/${month}`,
        { auth: true },
      );
      set({ monthPlans: res.data, loading: false });
    } catch {
      set({ monthPlans: [], loading: false });
    }
  },

  generatePlan: async (userInput, date) => {
    set({ generating: true, error: null });
    try {
      const res = await apiCall<DayPlanResponse>("/api/flowday/generate", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ userInput, date }),
      });
      set({ currentPlan: res.data, generating: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de la génération";
      set({ error: message, generating: false });
    }
  },

  toggleBlock: async (blockId) => {
    const plan = get().currentPlan;
    if (!plan) return;

    const previousPlan = plan;
    const updatedBlocks = plan.blocks.map((b) =>
      b.id === blockId ? { ...b, done: !b.done } : b,
    );

    // Update optimiste
    set({ currentPlan: { ...plan, blocks: updatedBlocks } });

    try {
      const res = await apiCall<DayPlanResponse>(`/api/flowday/${plan._id}`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify({ blocks: updatedBlocks }),
      });
      set({ currentPlan: res.data });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur de synchronisation";
      set({ currentPlan: previousPlan, error: message });
    }
  },
}));
