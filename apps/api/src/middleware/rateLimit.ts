import { createMiddleware } from "hono/factory";

// ---------------------------------------------------------------------------
// In-memory sliding window rate limiter
// ---------------------------------------------------------------------------

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    // Remove entries with no requests in the last 10 minutes
    entry.timestamps = entry.timestamps.filter((t) => now - t < 600_000);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ---------------------------------------------------------------------------
// createRateLimiter — factory that creates a rate-limiting middleware
// ---------------------------------------------------------------------------

export function createRateLimiter(opts: {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
  /** Optional key prefix to namespace different limiters */
  prefix?: string;
}) {
  const { maxRequests, windowMs, prefix = "rl" } = opts;

  return createMiddleware(async (c, next) => {
    // Use X-Forwarded-For if behind a proxy, fallback to remote address
    const forwarded = c.req.header("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
    const key = `${prefix}:${ip}`;
    const now = Date.now();

    let entry = store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      store.set(key, entry);
    }

    // Remove timestamps outside the current window
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

    if (entry.timestamps.length >= maxRequests) {
      // Calculate when the oldest request in window expires
      const oldestInWindow = entry.timestamps[0];
      const retryAfterMs = windowMs - (now - oldestInWindow);
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);

      c.header("Retry-After", String(retryAfterSec));
      return c.json(
        {
          success: false,
          error: {
            code: "TOO_MANY_REQUESTS",
            message: "Rate limit exceeded. Please try again later.",
          },
        },
        429
      );
    }

    entry.timestamps.push(now);
    await next();
  });
}

// ---------------------------------------------------------------------------
// Pre-configured rate limiters
// ---------------------------------------------------------------------------

/** Login/sign-in: 5 requests per minute */
export const loginRateLimit = createRateLimiter({
  maxRequests: 5,
  windowMs: 60_000,
  prefix: "login",
});

/** Registration: 3 requests per minute */
export const registerRateLimit = createRateLimiter({
  maxRequests: 3,
  windowMs: 60_000,
  prefix: "register",
});

/** QR public endpoint: 30 requests per minute */
export const qrRateLimit = createRateLimiter({
  maxRequests: 30,
  windowMs: 60_000,
  prefix: "qr",
});

/** Reviews: 10 requests per minute */
export const reviewsRateLimit = createRateLimiter({
  maxRequests: 10,
  windowMs: 60_000,
  prefix: "reviews",
});

/** General API: 100 requests per minute */
export const generalRateLimit = createRateLimiter({
  maxRequests: 100,
  windowMs: 60_000,
  prefix: "general",
});
