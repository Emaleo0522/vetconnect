import { Hono } from "hono";
import { auth } from "../lib/auth.js";

// ---------------------------------------------------------------------------
// Auth routes — Better Auth handler
// ---------------------------------------------------------------------------
// Better Auth exposes a standard Web Fetch handler (Request => Response).
// We mount it at /api/auth/* so all auth endpoints are handled automatically:
//   POST /api/auth/sign-up/email
//   POST /api/auth/sign-in/email
//   POST /api/auth/sign-out
//   GET  /api/auth/get-session
//   POST /api/auth/forget-password
//   GET  /api/auth/jwks
//   etc.
// ---------------------------------------------------------------------------

const authRouter = new Hono();

// Catch-all — delegates every /api/auth/* request to Better Auth
// We forward the response body/status but let Hono's CORS middleware add headers
authRouter.all("/api/auth/*", async (c) => {
  const response = await auth.handler(c.req.raw);
  const body = await response.text();

  // Copy Better Auth response headers (except CORS ones — Hono handles those)
  response.headers.forEach((value: string, key: string) => {
    const lower = key.toLowerCase();
    if (!lower.startsWith("access-control-")) {
      c.header(key, value);
    }
  });

  return c.body(body, response.status as any);
});

export { authRouter };
