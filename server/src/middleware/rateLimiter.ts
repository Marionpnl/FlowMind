import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { AuthRequest } from "./auth";

// Contre le brute-force sur les identifiants — appliqué avant toute
// authentification, donc limité par IP (pas d'userId disponible à ce stade).
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many attempts, try again later.",
  },
});

// Contre l'abus des routes qui appellent l'API OpenAI.
// Limité par utilisateur plutôt que par IP : ces routes sont toujours
// placées après `requireAuth`, donc `req.userId` est déjà disponible
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    (req as AuthRequest).userId || ipKeyGenerator(req.ip || "unknown"),
  message: {
    success: false,
    error: "AI request limit reached, try again later.",
  },
});
