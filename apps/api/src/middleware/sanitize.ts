import { createMiddleware } from "hono/factory";
import { sanitizeObject } from "../lib/sanitize.js";

// ---------------------------------------------------------------------------
// Body sanitization middleware — strips HTML/XSS from JSON bodies
// Applies to POST, PUT, PATCH requests with JSON content-type
// ---------------------------------------------------------------------------

export const sanitizeBody = createMiddleware(async (c, next) => {
  const method = c.req.method;
  const contentType = c.req.header("content-type") ?? "";

  // Only sanitize mutation requests with JSON bodies
  if (
    ["POST", "PUT", "PATCH"].includes(method) &&
    contentType.includes("application/json")
  ) {
    try {
      const originalJson = c.req.json.bind(c.req);

      // Override json() to return sanitized body
      c.req.json = async () => {
        const body = await originalJson();
        return sanitizeObject(body);
      };
    } catch {
      // If body parsing fails, let it pass through to the route handler
      // which will handle the error appropriately
    }
  }

  await next();
});
