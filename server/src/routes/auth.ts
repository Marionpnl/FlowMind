import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Habit from "../models/Habit";
import Resource from "../models/Resource";
import Spark from "../models/Spark";
import Interest from "../models/Interest";
import DayPlan from "../models/DayPlan";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password, location } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res
        .status(409)
        .json({ success: false, error: "User already exists" });

    // User model will hash the password via pre-save hook
    const user = await User.create({ name, email, password, location });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: user.location,
      },
    });
  } catch (err) {
    console.error("POST /api/auth/register error:", err);
    res.status(500).json({ success: false, error: "Unable to register" });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Error POST /api/auth/login:", error);
    res.status(500).json({ success: false, error: "Unable to login" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    res.status(500).json({ success: false, error: "Unable to fetch profile" });
  }
});

// Preference keys accepted from the client, with the type each must match to be applied.
const BOOLEAN_PREFERENCES = [
  "crossModuleSuggestions",
  "autoGeneratePlan",
  "dailyRediscovery",
  "animatedTransitions",
  "compactDensity",
  "readingHistory",
  "anonymousUsage",
  "crossModuleDataSharing",
] as const;
const STRING_PREFERENCES = ["aiTone", "aiLength"] as const;
const NUMBER_PREFERENCES = ["dataRetentionMonths"] as const;

// PUT /api/auth/me
router.put("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, location, timezone, language, theme, preferences } =
      req.body;
    const updates: Record<string, unknown> = {};
    if (name) updates.name = name;
    if (location) updates.location = location;
    if (timezone) updates.timezone = timezone;
    if (language) updates.language = language;
    if (theme === "papier" || theme === "encre" || theme === "systeme") {
      updates.theme = theme;
    }
    if (preferences && typeof preferences === "object") {
      for (const key of BOOLEAN_PREFERENCES) {
        if (typeof preferences[key] === "boolean") {
          updates[`preferences.${key}`] = preferences[key];
        }
      }
      for (const key of STRING_PREFERENCES) {
        if (typeof preferences[key] === "string" && preferences[key].trim()) {
          updates[`preferences.${key}`] = preferences[key].trim();
        }
      }
      for (const key of NUMBER_PREFERENCES) {
        if (typeof preferences[key] === "number" && preferences[key] > 0) {
          updates[`preferences.${key}`] = preferences[key];
        }
      }
    }

    const user = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
    }).select("-password");
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error("PUT /api/auth/me", err);
    res.status(500).json({ success: false, error: "Unable to update profile" });
  }
});

// DELETE /api/auth/me - Delete the account and all associated data
router.delete("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    await Promise.all([
      Habit.deleteMany({ userId }),
      Resource.deleteMany({ userId }),
      Spark.deleteMany({ userId }),
      Interest.deleteMany({ userId }),
      DayPlan.deleteMany({ userId }),
    ]);
    const user = await User.findByIdAndDelete(userId);
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/auth/me", err);
    res.status(500).json({ success: false, error: "Unable to delete account" });
  }
});

// GET /api/auth/export - Export all of the user's data as JSON
router.get("/export", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const [, habits, resources, sparks, interests, dayPlans] =
      await Promise.all([
        User.findByIdAndUpdate(userId, { lastExportAt: new Date() }),
        Habit.find({ userId }),
        Resource.find({ userId }),
        Spark.find({ userId }),
        Interest.find({ userId }),
        DayPlan.find({ userId }),
      ]);
    const user = await User.findById(userId).select("-password");
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    res.json({
      success: true,
      data: { user, habits, resources, sparks, interests, dayPlans },
    });
  } catch (err) {
    console.error("GET /api/auth/export", err);
    res.status(500).json({ success: false, error: "Unable to export data" });
  }
});

export default router;
