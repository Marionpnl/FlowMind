import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";

const router = Router();

// GET /api/users - Fetch all users
router.get("/", async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 }); // Exclude password and sort by creation date
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error("Error GET /api/users:", error);
    res.status(500).json({ success: false, error: "Unable to fetch users" });
  }
});

// POST /api/users - Create a new user
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Name, email and password are required",
      });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, error: "User with this email already exists" });
    }
    // Hash the password before saving the user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    res.status(201).json({
      success: true,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Error POST /api/users:", error);
    res.status(500).json({ success: false, error: "Unable to create user" });
  }
});

export default router;
