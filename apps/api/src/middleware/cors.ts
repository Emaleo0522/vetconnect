import { cors } from "hono/cors";
import { env } from "../lib/env.js";

export const corsMiddleware = cors({
  origin: env.CORS_ORIGINS.split(",").map((o) => o.trim()),
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  exposeHeaders: ["X-Request-Id"],
  credentials: true,
  maxAge: 86400,
});
