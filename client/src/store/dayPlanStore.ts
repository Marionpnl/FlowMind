import { create } from "zustand";
import apiCall from "@/lib/api";
import { resolveCascade } from "@/lib/scheduleCascade";
import type { IDayPlan, DayPlanBlock, HabitModule } from "@shared/types";

interface DayPlanResponse {
  success: boolean;
  data: IDayPlan;
}

export interface GenerationSummaryEntry {
  date: string;
  count: number;
}

interface GeneratePlanResponse {
  success: boolean;
  data: { plans: IDayPlan[]; summary: GenerationSummaryEntry[] };
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

export interface ReflowBlockInput {
  block: DayPlanBlock; // le bloc glissé, tel qu'il existe avant le déplacement
  targetDate: string;
  newTime: string;
  sourceDate?: string; // seulement si différent de targetDate
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
  lastGenerationSummary: GenerationSummaryEntry[] | null;
  fetchPlan: (date: string) => Promise<void>;
  fetchWeekPlans: (weekStart: string) => Promise<void>;
  fetchMonthPlans: (year: number, month: number) => Promise<void>;
  generatePlan: (userInput: string, date: string) => Promise<void>;
  toggleBlock: (blockId: string) => Promise<void>;
  scheduleActivity: (input: ScheduleActivityInput) => Promise<IDayPlan | null>;
  updateBlock: (blockId: string, updates: UpdateBlockInput) => Promise<void>;
  reflowBlock: (input: ReflowBlockInput) => Promise<void>;
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
  lastGenerationSummary: null,

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
      const res = await apiCall<GeneratePlanResponse>(
        "/api/flowday/generate",
        {
          method: "POST",
          auth: true,
          body: JSON.stringify({ userInput, date }),
        },
      );
      const { plans, summary } = res.data;
      const todayPlan = plans.find((p) => p.date === date);
      set((state) => ({
        currentPlan: todayPlan ?? state.currentPlan,
        weekPlans: plans.reduce(mergeIntoList, state.weekPlans),
        monthPlans: plans.reduce(mergeIntoList, state.monthPlans),
        generating: false,
        lastGenerationSummary: summary,
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de la génération";
      set({ error: message, generating: false });
    }
  },

  toggleBlock: async (blockId) => {
    const plan = get().currentPlan;
    if (!plan) return;
    const block = plan.blocks.find((b) => b.id === blockId);
    if (!block) return;
    const newDone = !block.done;

    const previousPlan = plan;
    const updatedBlocks = plan.blocks.map((b) =>
      b.id === blockId ? { ...b, done: newDone } : b,
    );

    // Update optimiste
    set({ currentPlan: { ...plan, blocks: updatedBlocks } });

    try {
      // Modifie uniquement ce bloc côté serveur ($set ciblé) plutôt que de
      // renvoyer tout le tableau : évite d'écraser des blocs ajoutés/modifiés
      // ailleurs depuis le dernier chargement de ce planning.
      const res = await apiCall<DayPlanResponse>(
        `/api/flowday/blocks/${blockId}`,
        {
          method: "PATCH",
          auth: true,
          body: JSON.stringify({ done: newDone }),
        },
      );
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

  // Déplace un bloc vers un nouveau jour/heure en repoussant en cascade les
  // blocs qu'il chevauche désormais, plutôt que de les échanger (voir
  // resolveCascade). Le client envoie seulement l'intention (quel bloc, quel
  // jour/heure) : le serveur recalcule lui-même la cascade à partir d'une
  // lecture fraîche du jour cible plutôt que de faire confiance à un tableau
  // potentiellement périmé.
  reflowBlock: async ({ block, targetDate, newTime, sourceDate }) => {
    const draggedBlockId = block.id;
    const isCrossDay = !!sourceDate && sourceDate !== targetDate;

    const previousPlan = get().currentPlan;
    const previousWeekPlans = get().weekPlans;
    const previousMonthPlans = get().monthPlans;

    const findTargetBlocks = (): DayPlanBlock[] => {
      if (previousPlan?.date === targetDate) return previousPlan.blocks;
      const fromWeek = previousWeekPlans.find((p) => p.date === targetDate);
      if (fromWeek) return fromWeek.blocks;
      const fromMonth = previousMonthPlans.find((p) => p.date === targetDate);
      return fromMonth?.blocks ?? [];
    };
    const others = findTargetBlocks().filter((b) => b.id !== draggedBlockId);

    const cascadeUpdates = resolveCascade(
      others.map((b) => ({ id: b.id, time: b.time, duration: b.duration })),
      block.duration,
      newTime,
    );

    const retime = (blocks: DayPlanBlock[]) =>
      blocks.map((b) =>
        cascadeUpdates[b.id] ? { ...b, time: cascadeUpdates[b.id] } : b,
      );

    // Aperçu optimiste : pose le bloc glissé sur le jour cible à sa nouvelle
    // heure, retime les blocs poussés, et le retire de son jour d'origine
    // s'il en change.
    const applyToPlan = (plan: IDayPlan): IDayPlan => {
      if (plan.date === targetDate) {
        const withoutDragged = plan.blocks.filter(
          (b) => b.id !== draggedBlockId,
        );
        return {
          ...plan,
          blocks: [...retime(withoutDragged), { ...block, time: newTime }],
        };
      }
      if (isCrossDay && plan.date === sourceDate) {
        return {
          ...plan,
          blocks: plan.blocks.filter((b) => b.id !== draggedBlockId),
        };
      }
      return plan;
    };

    set((state) => ({
      currentPlan: state.currentPlan
        ? applyToPlan(state.currentPlan)
        : state.currentPlan,
      weekPlans: state.weekPlans.map(applyToPlan),
      monthPlans: state.monthPlans.map(applyToPlan),
      error: null,
    }));

    try {
      const res = await apiCall<DayPlanResponse>("/api/flowday/reflow", {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ draggedBlockId, targetDate, newTime, sourceDate }),
      });
      const updated = res.data;
      set((state) => ({
        currentPlan:
          state.currentPlan?.date === updated.date
            ? updated
            : isCrossDay && state.currentPlan?.date === sourceDate
              ? {
                  ...state.currentPlan,
                  blocks: state.currentPlan.blocks.filter(
                    (b) => b.id !== draggedBlockId,
                  ),
                }
              : state.currentPlan,
        weekPlans: mergeIntoList(
          stripBlockElsewhere(state.weekPlans, draggedBlockId, updated.date),
          updated,
        ),
        monthPlans: mergeIntoList(
          stripBlockElsewhere(state.monthPlans, draggedBlockId, updated.date),
          updated,
        ),
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error reflowing block";
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
