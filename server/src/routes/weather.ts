import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import User from "../models/User";
import { fetchCurrentWeather } from "../services/weatherService";

const router = Router();

router.use(requireAuth);

// GET /api/weather - Current weather for the user's saved location
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select("location");
    if (!user?.location) {
      return res
        .status(400)
        .json({ success: false, message: "No location set" });
    }

    const weather = await fetchCurrentWeather(user.location);
    if (!weather) {
      return res
        .status(502)
        .json({ success: false, message: "Weather unavailable" });
    }

    res.json({ success: true, data: weather });
  } catch (error) {
    console.error("GET /api/weather", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
