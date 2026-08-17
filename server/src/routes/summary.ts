import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import DayPlan from "../models/DayPlan";
import Resource from "../models/Resource";
import Spark from "../models/Spark";
import Habit from "../models/Habit";
import User from "../models/User";
import {
  generateWeeklyBilan,
  type WeeklyStatsInput,
} from "../services/aiService";
import { truncateWords } from "../utils/text";

const router = Router();

router.use(requireAuth);

// Deterministic weekly stats (no AI) — shared by both routes below.
async function computeWeeklyStats(
  userId: string | undefined,
  weekStart: string,
): Promise<WeeklyStatsInput & { sparksGenerated: number }> {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const startStr = start.toISOString().split("T")[0];
  const endStr = end.toISOString().split("T")[0];
  const startDate = new Date(`${startStr}T00:00:00.000Z`);
  const endDate = new Date(`${endStr}T23:59:59.999Z`);

  const [plans, resources, sparksGenerated, habits] = await Promise.all([
    DayPlan.find({ userId, date: { $gte: startStr, $lte: endStr } }),
    Resource.find({ userId }).select("title notes progress"),
    Spark.countDocuments({
      userId,
      createdAt: { $gte: startDate, $lte: endDate },
    }),
    Habit.find({ userId }).select("name completedDates"),
  ]);

  const allBlocks = plans.flatMap((p) => p.blocks);
  const focusBlocks = allBlocks.filter((b) => b.module === "FlowDay");
  const readingBlocks = allBlocks.filter((b) => b.module === "MindShelf");
  const movementBlocks = allBlocks.filter((b) => b.module === "SparkTime");

  const focusMinutes = focusBlocks.reduce((s, b) => s + b.duration, 0);
  const readingMinutes = readingBlocks.reduce((s, b) => s + b.duration, 0);
  const movementMinutes = movementBlocks.reduce((s, b) => s + b.duration, 0);

  const morningFocusMinutes = focusBlocks
    .filter((b) => parseInt(b.time.split(":")[0], 10) < 12)
    .reduce((s, b) => s + b.duration, 0);
  const morningFocusPercent =
    focusMinutes > 0
      ? Math.round((morningFocusMinutes / focusMinutes) * 100)
      : 0;

  const notesTitlesThisWeek = resources.flatMap((r) =>
    r.notes
      .filter((n) => n.createdAt >= startDate && n.createdAt <= endDate)
      .map(() => r.title),
  );
  const touchedTitles = new Set(notesTitlesThisWeek);
  const resourcesProgress = resources
    .filter((r) => touchedTitles.has(r.title))
    .slice(0, 3)
    .map((r) => ({ title: r.title, progress: r.progress }));

  const sparktimeTitles = Array.from(
    new Set(movementBlocks.map((b) => b.title)),
  ).slice(0, 5);

  const habitStats = habits
    .map((h) => ({
      name: h.name,
      completions: h.completedDates.filter((d) => d >= startStr && d <= endStr)
        .length,
    }))
    .filter((h) => h.completions > 0);

  return {
    focusMinutes,
    readingMinutes,
    movementMinutes,
    morningFocusPercent,
    flowdayBlocksDone: focusBlocks.filter((b) => b.done).length,
    flowdayBlocksPlanned: focusBlocks.length,
    notesAdded: notesTitlesThisWeek.length,
    resourcesProgress,
    sparktimeBlocksDone: movementBlocks.filter((b) => b.done).length,
    sparktimeTitles,
    habits: habitStats,
    sparksGenerated,
  };
}

// GET /api/summary/weekly/stats?weekStart=YYYY-MM-DD - Deterministic weekly stats,
// no AI call — cheap enough to fetch automatically for the Dashboard card.
router.get("/weekly/stats", async (req: AuthRequest, res: Response) => {
  try {
    const weekStart = req.query.weekStart as string;
    if (!weekStart) {
      return res
        .status(400)
        .json({ success: false, message: "weekStart is required" });
    }

    const stats = await computeWeeklyStats(req.userId, weekStart);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("GET /api/summary/weekly/stats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/summary/weekly - AI-generated weekly bilan (title, highlights,
// synthesis, actions) built from the same stats, across FlowDay, MindShelf,
// SparkTime and habits. Not persisted, generated on demand.
router.post("/weekly", async (req: AuthRequest, res: Response) => {
  try {
    const { weekStart } = req.body;
    if (!weekStart) {
      return res
        .status(400)
        .json({ success: false, message: "weekStart is required" });
    }

    const stats = await computeWeeklyStats(req.userId, weekStart);

    const hasActivity =
      stats.focusMinutes > 0 ||
      stats.readingMinutes > 0 ||
      stats.movementMinutes > 0 ||
      stats.habits.length > 0 ||
      stats.sparksGenerated > 0;

    if (!hasActivity) {
      return res.status(400).json({
        success: false,
        message: "Not enough activity this week for a bilan",
      });
    }

    const user = await User.findById(req.userId).select("preferences");
    const bilan = await generateWeeklyBilan(
      stats,
      user?.preferences?.aiTone || "Calme et encourageant",
      user?.preferences?.aiLength || "Concise",
    );

    const validModules = ["FlowDay", "MindShelf", "SparkTime"];
    const title = bilan.title.trim()
      ? truncateWords(bilan.title.trim(), 20)
      : "Bilan de la semaine";
    const highlights = bilan.highlights
      .filter(
        (h) =>
          validModules.includes(h.module) &&
          typeof h.text === "string" &&
          h.text.trim(),
      )
      .slice(0, 3)
      .map((h) => ({ module: h.module, text: truncateWords(h.text.trim(), 20) }));
    const synthesis = bilan.synthesis.trim()
      ? truncateWords(bilan.synthesis.trim(), 60)
      : "";
    const actions = bilan.actions
      .filter((a) => typeof a === "string" && a.trim())
      .slice(0, 3)
      .map((a) => truncateWords(a.trim(), 15));

    res.json({
      success: true,
      data: { title, highlights, synthesis, actions, stats },
    });
  } catch (error) {
    console.error("POST /api/summary/weekly error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
