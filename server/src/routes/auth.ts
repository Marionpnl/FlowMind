import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
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

// PUT /api/auth/me
router.put("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, location } = req.body;
    const updates: Partial<Pick<IUser, "name" | "location">> = {};
    if (name) updates.name = name;
    if (location) updates.location = location;

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

export default router;
