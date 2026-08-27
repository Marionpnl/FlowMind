import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import DayPlan from "../models/DayPlan";
import User from "../models/User";
import {
  generateDayPlan,
  suggestScheduleSlot,
  generateDayBilan,
} from "../services/aiService";
import { truncateWords } from "../utils/text";
import { computeBlocksSignature } from "../utils/dayPlan";
import { resolveCascade } from "../utils/scheduleCascade";
import { aiLimiter } from "../middleware/rateLimiter";

const router = Router();

router.use(requireAuth);

// GET /api/flowday/week/:weekStart - Week planning (weekStart = Monday, "YYYY-MM-DD" format)
router.get("/week/:weekStart", async (req: AuthRequest, res: Response) => {
  try {
    const weekStart = req.params.weekStart as string;
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    const plans = await DayPlan.find({
      userId: req.userId,
      date: { $gte: startStr, $lte: endStr },
    });

    res.json({ success: true, data: plans });
  } catch (error) {
    console.error("GET /api/flowday/week/:weekStart", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// GET /api/flowday/month/:year/:month - Month planning (month = 1-12)
router.get("/month/:year/:month", async (req: AuthRequest, res: Response) => {
  try {
    const year = req.params.year as string;
    const month = req.params.month as string;
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    const startStr = `${yearNum}-${String(monthNum).padStart(2, "0")}-01`;
    const lastDay = new Date(yearNum, monthNum, 0).getDate(); // dernier jour du mois
    const endStr = `${yearNum}-${String(monthNum).padStart(2, "0")}-${lastDay}`;

    const plans = await DayPlan.find({
      userId: req.userId,
      date: { $gte: startStr, $lte: endStr },
    });

    res.json({ success: true, data: plans });
  } catch (error) {
    console.error("GET /api/flowday/month/:year/:month", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// GET /api/flowday/:date - Get the day plan for a specific date
router.get("/:date", async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.params;
    const plan = await DayPlan.findOne({ userId: req.userId, date });

    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "No plan found for this date" });
    }

    res.json({ success: true, data: plan });
  } catch (error) {
    console.error("GET /api/flowday/:date", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// PATCH /api/flowday/reflow - Move a block to a new date/time, pushing any
// block(s) it now overlaps out of the way (cascade) instead of swapping with
// them. The client sends only the intent (which block, which day/time) —
// the cascade itself is recomputed here from a fresh read of the target
// day's blocks, never trusted from a client-cached array.
router.patch("/reflow", async (req: AuthRequest, res: Response) => {
  try {
    const { draggedBlockId, targetDate, newTime, sourceDate } = req.body;

    if (!draggedBlockId || !targetDate || !newTime) {
      return res.status(400).json({
        success: false,
        message: "draggedBlockId, targetDate and newTime are required",
      });
    }

    const isCrossDay =
      typeof sourceDate === "string" && sourceDate !== targetDate;
    const sourcePlanDate = isCrossDay ? sourceDate : targetDate;

    const sourcePlan = await DayPlan.findOne({
      userId: req.userId,
      date: sourcePlanDate,
      "blocks.id": draggedBlockId,
    });
    if (!sourcePlan) {
      return res
        .status(404)
        .json({ success: false, message: "Block not found" });
    }
    const draggedBlock = sourcePlan.blocks.find(
      (b) => b.id === draggedBlockId,
    )!;

    const targetPlan = isCrossDay
      ? await DayPlan.findOne({ userId: req.userId, date: targetDate })
      : sourcePlan;
    const others = (targetPlan?.blocks ?? []).filter(
      (b) => b.id !== draggedBlockId,
    );

    const cascadeUpdates = resolveCascade(
      others.map((b) => ({ id: b.id, time: b.time, duration: b.duration })),
      draggedBlock.duration,
      newTime,
    );

    // Un seul $set avec un arrayFilter par bloc à retimer : met à jour
    // plusieurs éléments distincts du tableau en une seule requête atomique,
    // sans jamais relire-modifier-réécrire le tableau entier.
    function buildArrayFilterSet(entries: [string, string][]) {
      const setFields: Record<string, string> = {};
      const arrayFilters: Record<string, string>[] = [];
      entries.forEach(([blockId, time], i) => {
        setFields[`blocks.$[c${i}].time`] = time;
        arrayFilters.push({ [`c${i}.id`]: blockId });
      });
      return { setFields, arrayFilters };
    }

    let finalPlan;

    if (!isCrossDay) {
      const { setFields, arrayFilters } = buildArrayFilterSet([
        [draggedBlockId, newTime],
        ...Object.entries(cascadeUpdates),
      ]);
      finalPlan = await DayPlan.findOneAndUpdate(
        { userId: req.userId, date: targetDate },
        { $set: setFields },
        { new: true, arrayFilters, runValidators: true },
      );
    } else {
      const movedBlock = {
        id: draggedBlock.id,
        time: newTime,
        title: draggedBlock.title,
        subtitle: draggedBlock.subtitle,
        duration: draggedBlock.duration,
        module: draggedBlock.module,
        done: draggedBlock.done,
        sparkId: draggedBlock.sparkId,
      };

      // Le push vers le plan cible doit réussir avant qu'on retire le bloc
      // du plan source, sinon un échec de validation ferait perdre le bloc.
      let pushedPlan = await DayPlan.findOneAndUpdate(
        { userId: req.userId, date: targetDate },
        {
          $push: { blocks: movedBlock },
          $setOnInsert: { userId: req.userId, date: targetDate },
        },
        { new: true, upsert: true, runValidators: true },
      );

      const cascadeEntries = Object.entries(cascadeUpdates);
      if (cascadeEntries.length > 0) {
        const { setFields, arrayFilters } = buildArrayFilterSet(cascadeEntries);
        pushedPlan =
          (await DayPlan.findOneAndUpdate(
            { userId: req.userId, date: targetDate },
            { $set: setFields },
            { new: true, arrayFilters, runValidators: true },
          )) ?? pushedPlan;
      }

      await DayPlan.updateOne(
        { userId: req.userId, date: sourcePlanDate },
        { $pull: { blocks: { id: draggedBlockId } } },
      );

      finalPlan = pushedPlan;
    }

    if (!finalPlan) {
      return res
        .status(404)
        .json({ success: false, message: "Day plan not found" });
    }

    res.json({ success: true, data: finalPlan });
  } catch (error) {
    console.error("PATCH /api/flowday/reflow error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// PATCH /api/flowday/:id/summary - Generate and save the end-of-day narrative bilan
router.patch(
  "/:id/summary",
  aiLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const plan = await DayPlan.findOne({ _id: id, userId: req.userId });
      if (!plan) {
        return res
          .status(404)
          .json({ success: false, message: "Day plan not found" });
      }

      if (plan.blocks.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No blocks to summarize",
        });
      }

      const user = await User.findById(req.userId).select("preferences");
      const bilan = await generateDayBilan(
        plan.blocks.map((b) => ({
          time: b.time,
          title: b.title,
          module: b.module,
          duration: b.duration,
          done: b.done,
        })),
        user?.preferences?.aiTone || "Calme et encourageant",
        user?.preferences?.aiLength || "Concise",
      );

      if (bilan.title.trim()) {
        plan.endOfDaySummary = truncateWords(bilan.title.trim(), 20);
      }
      if (bilan.insight.trim()) {
        plan.endOfDayInsight = truncateWords(bilan.insight.trim(), 40);
      }
      plan.endOfDayBlocksSignature = computeBlocksSignature(plan.blocks);
      await plan.save();

      res.json({ success: true, data: plan });
    } catch (error) {
      console.error("PATCH /api/flowday/:id/summary error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

// POST /api/flowday/generate - Generate a new day plan based on user input
router.post("/generate", aiLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { userInput, date } = req.body;

    if (!userInput || !date) {
      return res.status(400).json({
        success: false,
        message: "userInput and date are required",
      });
    }

    // Le planning déjà présent pour la date de référence est donné à l'IA
    // comme contexte (pour qu'elle complète plutôt que d'ignorer ce qui existe)
    const existingPlan = await DayPlan.findOne({ userId: req.userId, date });
    const existingBlocks = existingPlan?.blocks ?? [];

    const generatedBlocks = await generateDayPlan(
      userInput,
      date,
      existingBlocks.map((b) => ({
        time: b.time,
        duration: b.duration,
        title: b.title,
      })),
    );

    const VALID_MODULES = ["FlowDay", "MindShelf", "SparkTime"];
    const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
    const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
    const MAX_DAYS_AHEAD = 30;
    const maxDate = new Date(date);
    maxDate.setDate(maxDate.getDate() + MAX_DAYS_AHEAD);
    const maxDateStr = maxDate.toISOString().slice(0, 10);

    // Une date hors de cette fenêtre (dans le passé, ou trop lointaine —
    // signe probable d'une hallucination) retombe sur la date de référence
    // plutôt que d'être prise telle quelle.
    function resolveDate(candidate: unknown): string {
      if (
        typeof candidate === "string" &&
        DATE_PATTERN.test(candidate) &&
        candidate >= date &&
        candidate <= maxDateStr
      ) {
        return candidate;
      }
      return date;
    }

    const newBlocksByDate = new Map<
      string,
      {
        id: string;
        time: string;
        title: string;
        subtitle?: string;
        duration: number;
        module: string;
        done: boolean;
      }[]
    >();
    generatedBlocks.forEach((b, index) => {
      const blockDate = resolveDate(b.date);
      const block = {
        id: `block-${Date.now()}-${index}`,
        time:
          typeof b.time === "string" && TIME_PATTERN.test(b.time)
            ? b.time
            : "09:00",
        title:
          typeof b.title === "string" && b.title.trim()
            ? b.title.trim()
            : "Activité",
        subtitle: b.subtitle,
        duration:
          typeof b.duration === "number" && b.duration > 0 ? b.duration : 30,
        module: VALID_MODULES.includes(b.module) ? b.module : "FlowDay",
        done: false,
      };
      const list = newBlocksByDate.get(blockDate) ?? [];
      list.push(block);
      newBlocksByDate.set(blockDate, list);
    });

    // Les blocs déjà présents sur les AUTRES dates concernées n'ont pas été
    // chargés plus haut (seule la date de référence l'a été) — il faut les
    // récupérer avant d'écrire, sinon le $set ci-dessous effacerait tout ce
    // qui existait déjà sur ces jours-là.
    const otherDates = [...newBlocksByDate.keys()].filter((d) => d !== date);
    const otherPlans = otherDates.length
      ? await DayPlan.find({ userId: req.userId, date: { $in: otherDates } })
      : [];
    const existingBlocksByDate = new Map<string, typeof existingBlocks>(
      otherPlans.map((p) => [p.date, p.blocks]),
    );
    existingBlocksByDate.set(date, existingBlocks);

    // Upsert : create a new plan if it doesn't exist, or update the existing one.
    // `$set` ciblé (pas de document de remplacement) : ne touche que
    // `userInput`/`blocks`, laisse `endOfDaySummary`/`endOfDayInsight` intacts —
    // leur mécanisme de péremption existant (comparaison de
    // `endOfDayBlocksSignature`) les régénérera de lui-même si besoin.

    const plans = [];
    for (const [blockDate, blocks] of newBlocksByDate) {
      const plan = await DayPlan.findOneAndUpdate(
        { userId: req.userId, date: blockDate },
        {
          $set: {
            userId: req.userId,
            date: blockDate,
            ...(blockDate === date ? { userInput } : {}),
            blocks: [...(existingBlocksByDate.get(blockDate) ?? []), ...blocks],
          },
        },
        { new: true, upsert: true },
      );
      plans.push(plan);
    }

    // Nombre de blocs NOUVEAUX par date (pas le total du planning) — pour que
    // le client puisse afficher "X blocs ajoutés aujourd'hui, Y demain".
    const summary = [...newBlocksByDate.entries()].map(([d, blocks]) => ({
      date: d,
      count: blocks.length,
    }));

    res.status(201).json({ success: true, data: { plans, summary } });
  } catch (error) {
    console.error("POST /api/flowday/generate", error);
    res.status(500).json({
      success: false,
      message: "Error generating the day plan",
    });
  }
});

// POST /api/flowday/blocks - Schedule a new activity block, anywhere from a module
// (SparkTime "Planifier", MindShelf "Planifier une lecture", FlowDay's own "Add bloc")
// date/time/duration are optional: whatever is left blank gets filled in by AI
router.post("/blocks", aiLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { title, notes, duration, date, time, module, sparkId } = req.body;

    if (!title || !module) {
      return res.status(400).json({
        success: false,
        message: "title and module are required",
      });
    }

    let resolvedDate = typeof date === "string" && date ? date : undefined;
    let resolvedTime = typeof time === "string" && time ? time : undefined;
    let resolvedDuration =
      typeof duration === "number" && duration > 0 ? duration : undefined;

    if (!resolvedDate || !resolvedTime || !resolvedDuration) {
      const today = new Date().toISOString().split("T")[0];
      const contextDate = resolvedDate || today;
      const existingPlan = await DayPlan.findOne({
        userId: req.userId,
        date: contextDate,
      });
      const todayBlocks = (existingPlan?.blocks || []).map((b) => ({
        time: b.time,
        duration: b.duration,
        title: b.title,
      }));

      const suggestion = await suggestScheduleSlot(
        title,
        notes,
        module,
        contextDate,
        todayBlocks,
      );

      resolvedDate =
        resolvedDate ||
        (typeof suggestion.date === "string" && suggestion.date
          ? suggestion.date
          : today);
      resolvedTime =
        resolvedTime ||
        (typeof suggestion.time === "string" && suggestion.time
          ? suggestion.time
          : "09:00");
      resolvedDuration =
        resolvedDuration ||
        (typeof suggestion.duration === "number" && suggestion.duration > 0
          ? suggestion.duration
          : 30);
    }

    const block = {
      id: `block-${Date.now()}`,
      time: resolvedTime,
      title,
      subtitle: notes || undefined,
      duration: resolvedDuration,
      module,
      done: false,
      sparkId: sparkId || undefined,
    };

    const plan = await DayPlan.findOneAndUpdate(
      { userId: req.userId, date: resolvedDate },
      {
        $push: { blocks: block },
        $setOnInsert: { userId: req.userId, date: resolvedDate },
      },
      { new: true, upsert: true },
    );

    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    console.error("POST /api/flowday/blocks error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// PATCH /api/flowday/blocks/:blockId - Update a single block (title/time/duration/subtitle/module/date)
// A date different from the block's current day moves it to that day's plan.
router.patch("/blocks/:blockId", async (req: AuthRequest, res: Response) => {
  try {
    const { blockId } = req.params;
    const { title, time, duration, subtitle, module, date, done } = req.body;

    const plan = await DayPlan.findOne({
      userId: req.userId,
      "blocks.id": blockId,
    });

    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "Block not found" });
    }

    const validDuration =
      typeof duration === "number" && duration > 0 ? duration : undefined;

    if (typeof date === "string" && date && date !== plan.date) {
      const block = plan.blocks.find((b) => b.id === blockId)!;
      const movedBlock = {
        id: block.id,
        time: time !== undefined ? time : block.time,
        title: title !== undefined ? title : block.title,
        subtitle: subtitle !== undefined ? subtitle : block.subtitle,
        duration: validDuration !== undefined ? validDuration : block.duration,
        module: module !== undefined ? module : block.module,
        done: block.done,
        sparkId: block.sparkId,
      };

      // Le push vers le plan cible doit réussir avant qu'on retire le bloc
      // du plan source, sinon un échec de validation ferait perdre le bloc.
      const targetPlan = await DayPlan.findOneAndUpdate(
        { userId: req.userId, date },
        {
          $push: { blocks: movedBlock },
          $setOnInsert: { userId: req.userId, date },
        },
        { new: true, upsert: true, runValidators: true },
      );

      // $pull ciblé par id plutôt qu'un save() du document entier chargé plus
      // haut : un save() réécrirait tout le tableau de blocs du jour source à
      // partir d'une copie potentiellement périmée
      await DayPlan.updateOne(
        { userId: req.userId, date: plan.date },
        { $pull: { blocks: { id: blockId } } },
      );

      return res.json({ success: true, data: targetPlan });
    }

    const setFields: Record<string, unknown> = {};
    if (title !== undefined) setFields["blocks.$.title"] = title;
    if (time !== undefined) setFields["blocks.$.time"] = time;
    if (validDuration !== undefined)
      setFields["blocks.$.duration"] = validDuration;
    if (subtitle !== undefined) setFields["blocks.$.subtitle"] = subtitle;
    if (module !== undefined) setFields["blocks.$.module"] = module;
    if (typeof done === "boolean") setFields["blocks.$.done"] = done;

    const updatedPlan = await DayPlan.findOneAndUpdate(
      { userId: req.userId, "blocks.id": blockId },
      { $set: setFields },
      { new: true, runValidators: true },
    );

    res.json({ success: true, data: updatedPlan });
  } catch (error) {
    console.error("PATCH /api/flowday/blocks/:blockId error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE /api/flowday/blocks/:blockId - Remove a single block
router.delete("/blocks/:blockId", async (req: AuthRequest, res: Response) => {
  try {
    const { blockId } = req.params;

    const plan = await DayPlan.findOneAndUpdate(
      { userId: req.userId, "blocks.id": blockId },
      { $pull: { blocks: { id: blockId } } },
      { new: true },
    );

    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "Block not found" });
    }

    res.json({ success: true, data: plan });
  } catch (error) {
    console.error("DELETE /api/flowday/blocks/:blockId error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
