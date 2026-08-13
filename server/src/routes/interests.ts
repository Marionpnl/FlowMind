import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import Interest from "../models/Interest";
import Habit from "../models/Habit";
import Resource from "../models/Resource";
import { detectInterests } from "../services/aiService";

const router = Router();

// Security Middleware applicated on all routes /api/interests
router.use(requireAuth);

// GET /api/interests - Interest List
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const interests = await Interest.find({ userId: req.userId }).sort({
      createdAt: -1,
    });
    res.json({ success: true, data: interests });
  } catch (error) {
    console.error("GET /api/interests error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/interests - Add an interest
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { name, emoji, category, importance, source } = req.body;
    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });

    const interest = await Interest.create({
      userId: req.userId,
      name,
      emoji: emoji || "✨",
      category,
      importance:
        typeof importance === "number" && importance >= 1 && importance <= 5
          ? importance
          : 3,
      source: source === "ai" ? "ai" : "manual",
    });

    res.status(201).json({ success: true, data: interest });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return res
        .status(409)
        .json({ success: false, message: "Interest already exists" });
    }
    console.error("POST /api/interests error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/interests/detect - Suggest interests from existing habits/resources (does not persist)
router.post("/detect", async (req: AuthRequest, res: Response) => {
  try {
    const [habits, resources, existingInterests] = await Promise.all([
      Habit.find({ userId: req.userId }).select("name"),
      Resource.find({ userId: req.userId }).select("title type tags"),
      Interest.find({ userId: req.userId }).select("name"),
    ]);

    if (habits.length === 0 && resources.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Not enough data to detect interests",
      });
    }

    const habitNames = habits.map((h) => h.name);
    const resourceSummaries = resources.map((r) =>
      r.tags.length
        ? `${r.title} (${r.type}, tags: ${r.tags.join(", ")})`
        : `${r.title} (${r.type})`,
    );
    const existingNames = existingInterests.map((i) => i.name);

    const detected = await detectInterests(
      habitNames,
      resourceSummaries,
      existingNames,
    );

    const existingNamesLower = existingNames.map((n) => n.toLowerCase());
    const seen = new Set<string>();
    const suggestions = detected
      .filter((d) => typeof d.name === "string" && d.name.trim().length > 0)
      .map((d) => ({
        name: d.name.trim(),
        emoji: typeof d.emoji === "string" && d.emoji ? d.emoji : "✨",
        category:
          typeof d.category === "string" && d.category
            ? d.category
            : undefined,
      }))
      .filter((d) => {
        const key = d.name.toLowerCase();
        if (existingNamesLower.includes(key) || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    res.json({ success: true, data: suggestions });
  } catch (error) {
    console.error("POST /api/interests/detect error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// PATCH /api/interests/:id - Update a interest
router.patch("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, emoji, category, importance } = req.body;

    const interest = await Interest.findOne({ _id: id, userId: req.userId });
    if (!interest)
      return res
        .status(404)
        .json({ success: false, message: "Interest not found" });

    if (name !== undefined) interest.name = name;
    if (emoji !== undefined) interest.emoji = emoji;
    if (category !== undefined) interest.category = category;
    if (
      typeof importance === "number" &&
      importance >= 1 &&
      importance <= 5
    )
      interest.importance = importance;

    await interest.save();
    res.json({ success: true, data: interest });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return res
        .status(409)
        .json({ success: false, message: "Interest already exists" });
    }
    console.error("PATCH /api/interests/:id error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE /api/interests/:id - Delete a interest
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const interest = await Interest.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!interest)
      return res
        .status(404)
        .json({ success: false, message: "Interest not found" });

    res.json({ success: true, message: "Interest deleted" });
  } catch (error) {
    console.error("DELETE /api/interests/:id error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
