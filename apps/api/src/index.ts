import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { env } from "./lib/env.js";
import { corsMiddleware } from "./middleware/cors.js";
import { securityHeaders } from "./middleware/security.js";
import { sanitizeBody } from "./middleware/sanitize.js";
import { serveStatic } from "@hono/node-server/serve-static";
import { health } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { profileRouter } from "./routes/profile.js";
import { petsRouter } from "./routes/pets.js";
import { medicalRouter } from "./routes/medical.js";
import { vetsRouter } from "./routes/vets.js";
import { reviewsRouter } from "./routes/reviews.js";
import { scheduleRouter } from "./routes/schedule.js";
import { vaccinationsRouter } from "./routes/vaccinations.js";
import { treatmentsRouter } from "./routes/treatments.js";
import { notificationsRouter } from "./routes/notifications.js";
import { pushTokensRouter } from "./routes/pushTokens.js";
import { startVaccinationAlerts } from "./jobs/vaccination-alerts.js";
import { generalRateLimit, loginRateLimit, registerRateLimit, qrRateLimit, reviewsRateLimit } from "./middleware/rateLimit.js";

const app = new Hono();

// --- Global middleware ---
app.use("*", logger());
app.use("*", corsMiddleware);
app.use("*", securityHeaders);
app.use("*", sanitizeBody);

// --- Static files (uploads) ---
app.use("/uploads/*", serveStatic({ root: "./" }));

// --- Rate limiting per route group ---
// Disabled in development — enable in production
if (env.NODE_ENV === "production") {
  app.use("/api/auth/sign-in/*", loginRateLimit);
  app.use("/api/auth/sign-up/*", registerRateLimit);
  app.use("/api/pets/qr/*", qrRateLimit);
  app.use("/api/pets/shared-card/*", qrRateLimit);
  app.use("/api/vets/:id/reviews/*", reviewsRateLimit);
  app.use("/api/*", generalRateLimit);
}

// --- Routes ---
app.route("/", health);
app.route("/", authRouter);
app.route("/", usersRouter);
app.route("/", profileRouter);
// Mount medical & vaccinations BEFORE petsRouter so public endpoints
// (GET /api/pets/qr/:uuid, GET /api/pets/shared-card/:token) are not
// blocked by petsRouter's blanket authGuard on /api/pets/*
app.route("/", medicalRouter);
app.route("/", vaccinationsRouter);  // /api/pets/:petId/vaccinations/* + shared card
app.route("/", petsRouter);
app.route("/", treatmentsRouter);    // /api/pets/:petId/treatments/*
app.route("/", notificationsRouter); // /api/notifications/*
app.route("/", pushTokensRouter);    // /api/push-tokens
app.route("/", scheduleRouter);  // /api/vets/me/* — must mount before vetsRouter to avoid :id catch
app.route("/", reviewsRouter);   // /api/vets/:id/reviews/*
app.route("/", vetsRouter);      // /api/vets, /api/vets/:id

// --- 404 fallback ---
app.notFound((c) => {
  return c.json({ success: false, error: { code: "NOT_FOUND", message: "Route not found" } }, 404);
});

// --- Global error handler ---
app.onError((err, c) => {
  // Preserve HTTP status from HTTPException (401, 403, 404, etc.)
  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: {
          code: err.message,
          message: err.message,
        },
      },
      err.status
    );
  }

  console.error(`[ERROR] ${err.message}`, {
    stack: env.NODE_ENV === "development" ? err.stack : undefined,
  });
  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    },
    500
  );
});

// --- Start server ---
console.log(`Starting VetConnect API on port ${env.PORT}...`);

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(`VetConnect API running at http://localhost:${info.port}`);
    // Start vaccination alerts job (runs once on startup, then every 24h)
    startVaccinationAlerts();
  }
);

export default app;
export type AppType = typeof app;
