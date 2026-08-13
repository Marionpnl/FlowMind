import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import Interest from "../models/Interest";

const router = Router();

// Security Middleware applicated on all routes /api/interests
router.use(requireAuth);

// GET /api/interests
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

// POST /api/interests
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { name, emoji, category } = req.body;
    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });

    const interest = await Interest.create({
      userId: req.userId,
      name,
      emoji: emoji || "✨",
      category,
      source: "manual",
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

// PATCH /api/interests/:id
router.patch("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, emoji, category } = req.body;

    const interest = await Interest.findOne({ _id: id, userId: req.userId });
    if (!interest)
      return res
        .status(404)
        .json({ success: false, message: "Interest not found" });

    if (name !== undefined) interest.name = name;
    if (emoji !== undefined) interest.emoji = emoji;
    if (category !== undefined) interest.category = category;

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

// DELETE /api/interests/:id
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
