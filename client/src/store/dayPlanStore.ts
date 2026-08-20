import { create } from "zustand";
import apiCall from "@/lib/api";
import type { IDayPlan, DayPlanBlock, HabitModule } from "@shared/types";

interface DayPlanResponse {
  success: boolean;
  data: IDayPlan;
}

export interface ScheduleActivityInput {
  title: string;
  notes?: string;
  duration?: number;
  date?: string;
  time?: string;
  module: HabitModule;
  sparkId?: string;
}

export interface UpdateBlockInput {
  title?: string;
  time?: string;
  duration?: number;
  subtitle?: string;
  module?: HabitModule;
  date?: string;
}

function mergeIntoList(list: IDayPlan[], updated: IDayPlan): IDayPlan[] {
  const idx = list.findIndex((p) => p.date === updated.date);
  if (idx === -1) return [...list, updated];
  const copy = [...list];
  copy[idx] = updated;
  return copy;
}

// Removes a block from every cached plan except the one it now belongs to —
// needed when an edit moves a block to a different date.
function stripBlockElsewhere(
  list: IDayPlan[],
  blockId: string,
  keepDate: string,
): IDayPlan[] {
  return list.map((p) =>
    p.date === keepDate
      ? p
      : { ...p, blocks: p.blocks.filter((b) => b.id !== blockId) },
  );
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
  scheduleActivity: (input: ScheduleActivityInput) => Promise<IDayPlan | null>;
  updateBlock: (blockId: string, updates: UpdateBlockInput) => Promise<void>;
  reorderDayBlocks: (planId: string, blocks: DayPlanBlock[]) => Promise<void>;
  deleteBlock: (blockId: string) => Promise<void>;
  submitDaySummary: (planId: string) => Promise<IDayPlan | null>;
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

  scheduleActivity: async (input) => {
    set({ error: null });
    try {
      const res = await apiCall<DayPlanResponse>("/api/flowday/blocks", {
        method: "POST",
        auth: true,
        body: JSON.stringify(input),
      });
      const updated = res.data;

      set((state) => ({
        currentPlan:
          updated.date === state.currentPlan?.date
            ? updated
            : state.currentPlan,
        weekPlans: mergeIntoList(state.weekPlans, updated),
        monthPlans: mergeIntoList(state.monthPlans, updated),
      }));

      return updated;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error scheduling activity";
      set({ error: message });
      return null;
    }
  },

  updateBlock: async (blockId, updates) => {
    const previousPlan = get().currentPlan;
    const previousWeekPlans = get().weekPlans;
    const previousMonthPlans = get().monthPlans;

    // Update optimiste sur les champs modifiés (ex. `time`) : un changement de
    // `date` ne déplace pas le bloc entre plans ici (on ne sait pas encore si
    // le plan du nouveau jour est déjà en cache) — ça reste géré par
    // stripBlockElsewhere/mergeIntoList une fois la vraie réponse serveur reçue.
    const patchBlocks = (blocks: typeof previousMonthPlans[number]["blocks"]) =>
      blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b));

    set((state) => ({
      currentPlan: state.currentPlan
        ? { ...state.currentPlan, blocks: patchBlocks(state.currentPlan.blocks) }
        : state.currentPlan,
      weekPlans: state.weekPlans.map((p) => ({
        ...p,
        blocks: patchBlocks(p.blocks),
      })),
      monthPlans: state.monthPlans.map((p) => ({
        ...p,
        blocks: patchBlocks(p.blocks),
      })),
      error: null,
    }));

    try {
      const res = await apiCall<DayPlanResponse>(
        `/api/flowday/blocks/${blockId}`,
        {
          method: "PATCH",
          auth: true,
          body: JSON.stringify(updates),
        },
      );
      const updated = res.data;

      set((state) => {
        const currentPlan =
          state.currentPlan?.date === updated.date
            ? updated
            : state.currentPlan
              ? {
                  ...state.currentPlan,
                  blocks: state.currentPlan.blocks.filter(
                    (b) => b.id !== blockId,
                  ),
                }
              : state.currentPlan;

        return {
          currentPlan,
          weekPlans: mergeIntoList(
            stripBlockElsewhere(state.weekPlans, blockId, updated.date),
            updated,
          ),
          monthPlans: mergeIntoList(
            stripBlockElsewhere(state.monthPlans, blockId, updated.date),
            updated,
          ),
        };
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error updating block";
      set({
        currentPlan: previousPlan,
        weekPlans: previousWeekPlans,
        monthPlans: previousMonthPlans,
        error: message,
      });
    }
  },

  // Réordonne les blocs au sein d'un même plan (ex. échanger deux blocs du
  // même jour en vue Mois) — `updateBlock` ne peut pas faire ça, il ne
  // modifie que les champs d'un bloc, jamais l'ordre du tableau. On envoie
  // le tableau complet réordonné via la route PUT existante (déjà utilisée
  // par `toggleBlock`).
  reorderDayBlocks: async (planId, blocks) => {
    const previousPlan = get().currentPlan;
    const previousWeekPlans = get().weekPlans;
    const previousMonthPlans = get().monthPlans;

    const applyReorder = (plans: IDayPlan[]) =>
      plans.map((p) => (p._id === planId ? { ...p, blocks } : p));

    set((state) => ({
      currentPlan:
        state.currentPlan?._id === planId
          ? { ...state.currentPlan, blocks }
          : state.currentPlan,
      weekPlans: applyReorder(state.weekPlans),
      monthPlans: applyReorder(state.monthPlans),
      error: null,
    }));

    try {
      const res = await apiCall<DayPlanResponse>(`/api/flowday/${planId}`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify({ blocks }),
      });
      const updated = res.data;
      set((state) => ({
        currentPlan:
          state.currentPlan?._id === planId ? updated : state.currentPlan,
        weekPlans: mergeIntoList(state.weekPlans, updated),
        monthPlans: mergeIntoList(state.monthPlans, updated),
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error reordering blocks";
      set({
        currentPlan: previousPlan,
        weekPlans: previousWeekPlans,
        monthPlans: previousMonthPlans,
        error: message,
      });
    }
  },

  deleteBlock: async (blockId) => {
    const plan = get().currentPlan;
    const previousPlan = plan;
    const previousWeekPlans = get().weekPlans;
    const previousMonthPlans = get().monthPlans;

    // Update optimiste
    set((state) => ({
      currentPlan: plan
        ? { ...plan, blocks: plan.blocks.filter((b) => b.id !== blockId) }
        : plan,
      weekPlans: state.weekPlans.map((p) => ({
        ...p,
        blocks: p.blocks.filter((b) => b.id !== blockId),
      })),
      monthPlans: state.monthPlans.map((p) => ({
        ...p,
        blocks: p.blocks.filter((b) => b.id !== blockId),
      })),
    }));

    try {
      const res = await apiCall<DayPlanResponse>(
        `/api/flowday/blocks/${blockId}`,
        { method: "DELETE", auth: true },
      );
      const updated = res.data;
      set((state) => ({
        currentPlan:
          updated.date === state.currentPlan?.date
            ? updated
            : state.currentPlan,
        weekPlans: mergeIntoList(state.weekPlans, updated),
        monthPlans: mergeIntoList(state.monthPlans, updated),
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error deleting block";
      set({
        currentPlan: previousPlan,
        weekPlans: previousWeekPlans,
        monthPlans: previousMonthPlans,
        error: message,
      });
    }
  },

  submitDaySummary: async (planId) => {
    set({ error: null });
    try {
      const res = await apiCall<DayPlanResponse>(
        `/api/flowday/${planId}/summary`,
        { method: "PATCH", auth: true },
      );
      const updated = res.data;

      set((state) => ({
        currentPlan:
          updated.date === state.currentPlan?.date
            ? updated
            : state.currentPlan,
        weekPlans: mergeIntoList(state.weekPlans, updated),
        monthPlans: mergeIntoList(state.monthPlans, updated),
      }));

      return updated;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error generating day summary";
      set({ error: message });
      return null;
    }
  },
}));
