import { z } from "zod";
import { Router, Request, Response } from "express";
import { formatZodError } from "../utils/formatZodErrors";
import { usernameSchema, passwordSchema } from "../scehma/auth.schema";
import { registerUser, authenticateUser } from "../services/auth.service";
import { rateLimiterMiddleware } from "../middleware/rate-limiter.middleware";

const router = Router();

router.post("/register", rateLimiterMiddleware, async (req: Request, res: Response) => {
  const registerBodySchema = z.preprocess(
    (val) => (val === undefined ? {} : val),
    z.strictObject({
      username: usernameSchema.transform((s) => s.toLowerCase()),
      password: passwordSchema,
    })
  );
  const parsed = registerBodySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid request",
      details: formatZodError(parsed.error),
    });
  }

  const { username, password } = parsed.data;
  const result = await registerUser(username, password);

  if (!result.ok) {
    return res.status(409).json({
      ok: false,
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
  const loginBodySchema = z.preprocess(
    (val) => (val === undefined ? {} : val),
    z.strictObject({
      username: usernameSchema.transform((s) => s.toLowerCase()),
      password: z.string(),
    })
  );

  const parsed = loginBodySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(401).json({
      ok: false,
      error: "Invalid username or password",
    });
  }

  const { username, password } = parsed.data;
  const result = await authenticateUser(username, password);

  if (!result.ok) {
    return res.status(401).json({
      ok: false,
      error: result.error,
    });
  }

  /*
  * TODO: Issue JWT token here in the future
  * const token = generateJWT({ username: result.username, roles: result.roles });
  * Return the token in the response body or as an HTTP-only cookie
  */

  /*
  * TODO: Check password expiry and notify user if password is expired or near expiry
  * const expiryInfo = checkPasswordExpiry(user);
  * Return appropriate warnings or force password change if expired
  */

  return res.status(200).json({
    ok: true,
    authenticated: true,
    username,
    /*
    * TODO: Include JWT token
    * token,
    */
    /*
    * TODO: Include password expiry warnings
    * passwordExpiryWarning: null,
    */
  });
});

export default router;
