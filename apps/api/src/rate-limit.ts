import type { NextFunction, Request, RequestHandler, Response } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export function createRateLimit(maximumRequests: number, windowMs: number): RequestHandler {
  const entries = new Map<string, RateLimitEntry>();

  return (request: Request, response: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = request.ip || "unknown";
    const current = entries.get(key);
    const entry = current === undefined || current.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : current;
    entry.count += 1;
    entries.set(key, entry);

    response.setHeader("RateLimit-Limit", maximumRequests);
    response.setHeader("RateLimit-Remaining", Math.max(0, maximumRequests - entry.count));
    response.setHeader("RateLimit-Reset", Math.ceil(entry.resetAt / 1000));

    if (entry.count > maximumRequests) {
      response.status(429).json({
        error: {
          code: "rate_limit_exceeded",
          message: "Request limit exceeded. Try again after the reset time."
        }
      });
      return;
    }
    next();
  };
}
