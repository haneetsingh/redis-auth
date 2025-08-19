import request from "supertest";
import express, { Request, Response } from "express";
import rateLimit from "express-rate-limit";

const createApp = () => {
  const app = express();

  const limiter = rateLimit({
    windowMs: 1000,
    max: 3,
    handler: (_req: Request, res: Response) =>
      res.status(429).json({ error: "Too many requests" }),
  });

  app.use(limiter);
  app.get("/test", (_req, res) => res.json({ ok: true }));
  return app;
};

describe("rateLimiterMiddleware integration", () => {
  let app: express.Express;

  beforeEach(() => {
    app = createApp();
  });

  it("should allow requests when not rate limited", async () => {
    const response = await request(app)
      .get("/test")
      .expect(200);

    expect(response.body).toEqual({ ok: true });
  });

  it("should block requests when rate limit is exceeded", async () => {
    // Make multiple requests to exceed the limit
    await request(app).get("/test").expect(200);
    await request(app).get("/test").expect(200);
    await request(app).get("/test").expect(200);
    
    // Fourth request should be rate limited
    const response = await request(app)
      .get("/test")
      .expect(429);

    expect(response.body).toEqual({ error: "Too many requests" });
  });

  it("should reset after window time", async () => {
    // Exceed rate limit
    for (let i = 0; i < 3; i++) {
      await request(app).get("/test");
    }

    // Wait for the window to reset (1 second in test config)
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Should work again after reset
    const response = await request(app)
      .get("/test")
      .expect(200);

    expect(response.body).toEqual({ ok: true });
  });
});
