import { z } from "zod";
import { Router, Request, Response } from "express";
import { usernameSchema, passwordSchema } from "../scehma/auth.schema";
import { formatZodError } from "../utils/formatZodErrors";

const router = Router();
const authBodySchema = z.preprocess(
  (val) => (val === undefined ? {} : val),
  z.strictObject({
    username: usernameSchema.transform((s) => s.toLowerCase()),
    password: passwordSchema
  })
);

router.post("/register", async (req: Request, res: Response) => {
  const parsed = authBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid request body",
      details: formatZodError(parsed.error),
    });
  }

  res.status(201).json({
    ok: true,
    message: "User registered successfully",
  });
});

export default router;
