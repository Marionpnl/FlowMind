import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import User from "../models/User";
import Interest from "../models/Interest";
import { fetchNearbyEvents } from "../services/ticketmasterService";
import { scoreEventsByInterests } from "../utils/localEventRelevance";

const router = Router();

router.use(requireAuth);

const MAX_EVENTS_RETURNED = 6;
const DEFAULT_RADIUS_KM = 10;
// Mêmes bornes que le slider "Distance max" d'AdjustSuggestionsPanel.tsx.
const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 20;

// GET /api/local-events?maxDistance=N - Real events within N km of the
// user's saved location, ranked by relevance to their stored interests
// (deterministic, no AI — see localEventRelevance.ts for why). `maxDistance`
// réutilise le même réglage que la génération de Sparks plutôt qu'un
// deuxième contrôle dédié.
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select("location");
    if (!user?.location) {
      return res
        .status(400)
        .json({ success: false, message: "No location set" });
    }

    const requestedRadius = Number(req.query.maxDistance);
    const radiusKm =
      Number.isFinite(requestedRadius) &&
      requestedRadius >= MIN_RADIUS_KM &&
      requestedRadius <= MAX_RADIUS_KM
        ? requestedRadius
        : DEFAULT_RADIUS_KM;

    const rawEvents = await fetchNearbyEvents(user.location, radiusKm);
    if (!rawEvents) {
      return res
        .status(502)
        .json({ success: false, message: "Local events unavailable" });
    }

    const interests = await Interest.find({ userId: req.userId }).select(
      "name category",
    );

    const ranked = scoreEventsByInterests(rawEvents, interests).slice(
      0,
      MAX_EVENTS_RETURNED,
    );

    res.json({ success: true, data: ranked });
  } catch (error) {
    console.error("GET /api/local-events", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
