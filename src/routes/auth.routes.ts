import { z } from "zod";
import { Router, Request, Response } from "express";
import { formatZodError } from "../utils/formatZodErrors";
import { usernameSchema, passwordSchema } from "../scehma/auth.schema";
import { registerUser, authenticateUser } from "../services/auth.service";
import { rateLimiterMiddleware } from "../middleware/rate-limiter.middleware";

const router = Router();
const authBodySchema = z.preprocess(
  (val) => (val === undefined ? {} : val),
  z.strictObject({
    username: usernameSchema.transform((s) => s.toLowerCase()),
    password: passwordSchema,
  })
);

router.post("/register", rateLimiterMiddleware, async (req: Request, res: Response) => {
  const parsed = authBodySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request",
      details: formatZodError(parsed.error),
    });
  }

  const { username, password } = parsed.data;
  const result = await registerUser(username, password);

  if (!result.ok) {
    return res.status(409).json({
      error: result.error,
      details: result.details || {},
    });
  }

  return res.status(201).json({
    ok: true,
    username: result.username,
    message: "User registered successfully",
  });
});


router.post("/login", rateLimiterMiddleware, async (req: Request, res: Response) => {
  const parsed = authBodySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request",
      details: formatZodError(parsed.error),
    });
  }

  const { username, password } = parsed.data;
  const result = await authenticateUser(username, password);

  if (!result.ok) {
    return res.status(401).json({ error: result.error });
  }

  return res.status(200).json({ authenticated: true, username });
});

export default router;
