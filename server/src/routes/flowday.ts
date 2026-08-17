import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import DayPlan from "../models/DayPlan";
import {
  generateDayPlan,
  suggestScheduleSlot,
  generateDayBilan,
} from "../services/aiService";
import { truncateWords } from "../utils/text";

const router = Router();

router.use(requireAuth);

// Fingerprint of a day's blocks (id + done status) — used to detect whether the
// end-of-day bilan is stale relative to the current state of the plan.
function computeBlocksSignature(blocks: { id: string; done: boolean }[]): string {
  return blocks
    .map((b) => `${b.id}:${b.done ? 1 : 0}`)
    .sort()
    .join(",");
}

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

// PUT /api/flowday/:id - Update an existing day plan (e.g., check a block)
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { blocks, endOfDaySummary } = req.body;

    const updates: Record<string, unknown> = {};
    if (blocks) updates.blocks = blocks;
    if (endOfDaySummary !== undefined)
      updates.endOfDaySummary = endOfDaySummary;

    const plan = await DayPlan.findOneAndUpdate(
      { _id: id, userId: req.userId },
      updates,
      { new: true },
    );

    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "Day plan not found" });
    }

    res.json({ success: true, data: plan });
  } catch (error) {
    console.error("PUT /api/flowday/:id", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// PATCH /api/flowday/:id/summary - Generate and save the end-of-day narrative bilan
router.patch("/:id/summary", async (req: AuthRequest, res: Response) => {
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

    const bilan = await generateDayBilan(
      plan.blocks.map((b) => ({
        time: b.time,
        title: b.title,
        module: b.module,
        duration: b.duration,
        done: b.done,
      })),
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
});

// POST /api/flowday/generate - Generate a new day plan based on user input
router.post("/generate", async (req: AuthRequest, res: Response) => {
  try {
    const { userInput, date } = req.body;

    if (!userInput || !date) {
      return res.status(400).json({
        success: false,
        message: "userInput and date are required",
      });
    }

    const generatedBlocks = await generateDayPlan(userInput);

    const blocks = generatedBlocks.map((b, index) => ({
      id: `block-${Date.now()}-${index}`,
      time: b.time,
      title: b.title,
      subtitle: b.subtitle,
      duration:
        typeof b.duration === "number" && b.duration > 0 ? b.duration : 30,
      module: b.module,
      done: false,
    }));

    // Upsert : create a new plan if it doesn't exist, or update the existing one
    const plan = await DayPlan.findOneAndUpdate(
      { userId: req.userId, date },
      { userId: req.userId, date, userInput, blocks },
      { new: true, upsert: true },
    );

    res.status(201).json({ success: true, data: plan });
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
router.post("/blocks", async (req: AuthRequest, res: Response) => {
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
    const { title, time, duration, subtitle, module, date } = req.body;

    const plan = await DayPlan.findOne({
      userId: req.userId,
      "blocks.id": blockId,
    });

    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "Block not found" });
    }

    if (typeof date === "string" && date && date !== plan.date) {
      const block = plan.blocks.find((b) => b.id === blockId)!;
      const movedBlock = {
        id: block.id,
        time: time !== undefined ? time : block.time,
        title: title !== undefined ? title : block.title,
        subtitle: subtitle !== undefined ? subtitle : block.subtitle,
        duration: duration !== undefined ? duration : block.duration,
        module: module !== undefined ? module : block.module,
        done: block.done,
        sparkId: block.sparkId,
      };

      plan.blocks = plan.blocks.filter(
        (b) => b.id !== blockId,
      ) as typeof plan.blocks;
      await plan.save();

      const targetPlan = await DayPlan.findOneAndUpdate(
        { userId: req.userId, date },
        {
          $push: { blocks: movedBlock },
          $setOnInsert: { userId: req.userId, date },
        },
        { new: true, upsert: true },
      );

      return res.json({ success: true, data: targetPlan });
    }

    const setFields: Record<string, unknown> = {};
    if (title !== undefined) setFields["blocks.$.title"] = title;
    if (time !== undefined) setFields["blocks.$.time"] = time;
    if (duration !== undefined) setFields["blocks.$.duration"] = duration;
    if (subtitle !== undefined) setFields["blocks.$.subtitle"] = subtitle;
    if (module !== undefined) setFields["blocks.$.module"] = module;

    const updatedPlan = await DayPlan.findOneAndUpdate(
      { userId: req.userId, "blocks.id": blockId },
      { $set: setFields },
      { new: true },
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
