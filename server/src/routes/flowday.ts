import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import DayPlan from "../models/DayPlan";
import { generateDayPlan } from "../services/aiService";

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

// PUT /api/flowday/:id - Update an existing day plan (e.g., check a block)
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { blocks, energyScore, endOfDaySummary } = req.body;

    const updates: Record<string, unknown> = {};
    if (blocks) updates.blocks = blocks;
    if (energyScore !== undefined) updates.energyScore = energyScore;
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

export default router;
