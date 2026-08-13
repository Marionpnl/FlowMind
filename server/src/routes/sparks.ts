import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import Spark from "../models/Spark";
import Interest from "../models/Interest";
import User from "../models/User";
import { generateSparks } from "../services/aiService";

const router = Router();

// Security Middleware applicated on all routes /api/sparks
router.use(requireAuth);

// POST /api/sparks/generate - Generate and persist new activity suggestions
router.post("/generate", async (req: AuthRequest, res: Response) => {
  try {
    const [interests, user] = await Promise.all([
      Interest.find({ userId: req.userId }).select("name"),
      User.findById(req.userId).select("location"),
    ]);

    if (interests.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Not enough data to generate sparks",
      });
    }

    const interestNames = interests.map((i) => i.name);
    const generated = await generateSparks(interestNames, user?.location);

    const sparksData = generated.map((s) => ({
      userId: req.userId,
      title: s.title,
      description: s.description,
      emoji: typeof s.emoji === "string" && s.emoji ? s.emoji : "✨",
      duration:
        typeof s.duration === "number" && s.duration > 0 ? s.duration : 30,
      interestName: interestNames.includes(s.interestName)
        ? s.interestName
        : interestNames[0],
    }));

    const sparks = await Spark.insertMany(sparksData);

    res.status(201).json({ success: true, data: sparks });
  } catch (error) {
    console.error("POST /api/sparks/generate error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/sparks - Spark list
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const sparks = await Spark.find({ userId: req.userId }).sort({
      createdAt: -1,
    });
    res.json({ success: true, data: sparks });
  } catch (error) {
    console.error("GET /api/sparks error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
