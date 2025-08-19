import { Request, Response, NextFunction } from "express";

export function errorHandlerMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
