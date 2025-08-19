import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { RATE_MAX, RATE_WINDOW_MS } from "../utils/config";

export const rateLimiterMiddleware = rateLimit({
  windowMs: RATE_WINDOW_MS,
  max: RATE_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => res.status(429).json({ error: "Too many requests" }),
});
