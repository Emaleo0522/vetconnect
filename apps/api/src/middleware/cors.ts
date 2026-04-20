import { cors } from "hono/cors";
import { env } from "../lib/env.js";

export const corsMiddleware = cors({
  origin: env.CORS_ORIGINS.split(",").map((o) => o.trim()),
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  // Expose Set-Cookie so browsers can read the cookie on cross-origin responses
  exposeHeaders: ["X-Request-Id", "Set-Cookie"],
  credentials: true,
  maxAge: 86400,
});
