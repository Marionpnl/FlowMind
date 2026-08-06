import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import Habit from "../models/Habit";

const router = Router();

// Security Middleware applicated on all routes /api/habits
router.use(requireAuth);

// GET /api/habits
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const habits = await Habit.find({ userId: req.userId }).sort({
      createdAt: -1,
    });
    res.json({ success: true, data: habits });
  } catch (error) {
    console.error("GET /api/habits error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/habits
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { name, emoji } = req.body;
    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });

    const habit = await Habit.create({
      userId: req.userId,
      name,
      emoji: emoji || "⚡",
    });

    res.status(201).json({ success: true, data: habit });
  } catch (error) {
    console.error("POST /api/habits error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// PATCH /api/habits/:id/check - Check/Uncheck for a date
router.patch("/:id/check", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { date } = req.body; // Expected format: "YYYY-MM-DD"

    const targetDate = date || new Date().toISOString().split("T")[0];

    const habit = await Habit.findOne({ _id: id, userId: req.userId });
    if (!habit)
      return res
        .status(404)
        .json({ success: false, message: "Habit not found" });

    const dateIndex = habit.completedDates.indexOf(targetDate);
    if (dateIndex > -1) {
      habit.completedDates.splice(dateIndex, 1); // Uncheck
    } else {
      habit.completedDates.push(targetDate); // Check
    }

    await habit.save();
    res.json({ success: true, data: habit });
  } catch (error) {
    console.error("PATCH /api/habits/:id/check error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE /api/habits/:id
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const habit = await Habit.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!habit)
      return res
        .status(404)
        .json({ success: false, message: "Habit not found" });

    res.json({ success: true, message: "Habit deleted" });
  } catch (error) {
    console.error("DELETE /api/habits/:id error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
