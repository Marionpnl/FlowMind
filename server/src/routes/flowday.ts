import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import DayPlan from "../models/DayPlan";
import { generateDayPlan } from "../services/aiService";

const router = Router();

router.use(requireAuth);

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
