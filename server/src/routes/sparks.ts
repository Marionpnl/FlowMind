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
    const { maxDuration, energyLevel, maxDistance } = req.body;

    const [interests, user, visibleSparks, recentlyDismissed] =
      await Promise.all([
        Interest.find({ userId: req.userId }).select(
          "name category importance",
        ),
        User.findById(req.userId).select("location"),
        Spark.find({ userId: req.userId, dismissed: false }).select("title"),
        Spark.find({ userId: req.userId, dismissed: true })
          .sort({ dismissedAt: -1 })
          .limit(10)
          .select("title"),
      ]);

    if (interests.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Not enough data to generate sparks",
      });
    }

    const interestNames = interests.map((i) => i.name);
    const categoryByInterestName = new Map(
      interests.map((i) => [i.name, i.category]),
    );
    // Triés par importance décroissante pour que le prompt liste d'abord les
    // centres d'intérêt prioritaires — cf. aiService.ts pour comment l'IA
    // s'en sert.
    const rankedInterests = [...interests]
      .sort((a, b) => b.importance - a.importance)
      .map((i) => ({ name: i.name, importance: i.importance }));
    const validMaxDuration =
      typeof maxDuration === "number" && maxDuration > 0
        ? maxDuration
        : undefined;
    const validMaxDistance =
      typeof maxDistance === "number" && maxDistance > 0
        ? maxDistance
        : undefined;
    const avoidTitles = [...visibleSparks, ...recentlyDismissed].map(
      (s) => s.title,
    );

    const generated = await generateSparks(
      rankedInterests,
      user?.location,
      validMaxDuration,
      typeof energyLevel === "string" ? energyLevel : undefined,
      validMaxDistance,
      avoidTitles,
    );

    const sparksData = generated.map((s) => {
      const interestName = interestNames.includes(s.interestName)
        ? s.interestName
        : interestNames[0];
      let duration =
        typeof s.duration === "number" && s.duration > 0 ? s.duration : 30;
      if (validMaxDuration) duration = Math.min(duration, validMaxDuration);

      return {
        userId: req.userId,
        title: s.title,
        description: s.description,
        emoji: typeof s.emoji === "string" && s.emoji ? s.emoji : "✨",
        duration,
        interestName,
        category:
          categoryByInterestName.get(interestName) ||
          (typeof s.category === "string" && s.category
            ? s.category
            : undefined),
        detail:
          typeof s.detail === "string" && s.detail ? s.detail : undefined,
        energyLevel:
          typeof s.energyLevel === "string" && s.energyLevel
            ? s.energyLevel
            : typeof energyLevel === "string"
              ? energyLevel
              : undefined,
      };
    });

    const sparks = await Spark.insertMany(sparksData);

    res.status(201).json({ success: true, data: sparks });
  } catch (error) {
    console.error("POST /api/sparks/generate error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/sparks - Spark list (dismissed ones stay hidden but aren't erased)
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const sparks = await Spark.find({
      userId: req.userId,
      dismissed: false,
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: sparks });
  } catch (error) {
    console.error("GET /api/sparks error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE /api/sparks/:id - Dismiss a spark (soft delete: hidden, kept for AI rotation context)
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const spark = await Spark.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { dismissed: true, dismissedAt: new Date() },
      { new: true },
    );

    if (!spark) {
      return res
        .status(404)
        .json({ success: false, message: "Spark not found" });
    }

    res.json({ success: true, data: spark });
  } catch (error) {
    console.error("DELETE /api/sparks/:id error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
