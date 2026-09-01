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
const MAX_RADIUS_KM = 100;

// GET /api/local-events?maxDistance=N|none - Real events within N km of the
// user's saved location (ou sans limite de distance, dans tout le pays, si
// maxDistance=none — voir ticketmasterService.fetchNearbyEvents), ranked by
// relevance to their stored interests (deterministic, no AI — see
// localEventRelevance.ts for why). `maxDistance` réutilise le même réglage
// que la génération de Sparks plutôt qu'un deuxième contrôle dédié.
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select(
      "location dismissedLocalEventIds",
    );
    if (!user?.location) {
      return res
        .status(400)
        .json({ success: false, message: "No location set" });
    }

    let radiusKm: number | null;
    if (req.query.maxDistance === "none") {
      radiusKm = null;
    } else {
      const requestedRadius = Number(req.query.maxDistance);
      radiusKm =
        Number.isFinite(requestedRadius) &&
        requestedRadius >= MIN_RADIUS_KM &&
        requestedRadius <= MAX_RADIUS_KM
          ? requestedRadius
          : DEFAULT_RADIUS_KM;
    }

    const rawEvents = await fetchNearbyEvents(user.location, radiusKm);
    if (!rawEvents) {
      return res
        .status(502)
        .json({ success: false, message: "Local events unavailable" });
    }

    const interests = await Interest.find({ userId: req.userId }).select(
      "name category",
    );

    // Masqué par l'utilisatrice (bouton supprimer sur la carte) — filtré
    // avant la troncature à MAX_EVENTS_RETURNED, pour que l'événement suivant
    // dans le classement remonte à la place, pas juste "un de moins affiché".
    const dismissed = new Set(user.dismissedLocalEventIds ?? []);
    const ranked = scoreEventsByInterests(rawEvents, interests)
      .filter((e) => !dismissed.has(e.id))
      .slice(0, MAX_EVENTS_RETURNED);

    res.json({ success: true, data: ranked });
  } catch (error) {
    console.error("GET /api/local-events", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE /api/local-events/:eventId - Hide a local event on this account,
// same shape as DELETE /api/sparks/:id. Real events are never persisted
// server-side themselves (see ticketmasterService.ts) so there's no document
// to soft-delete — only the id to keep filtering out is remembered.
router.delete("/:eventId", async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;

    await User.findByIdAndUpdate(req.userId, {
      $addToSet: { dismissedLocalEventIds: eventId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/local-events/:eventId", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
