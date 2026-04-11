import type { MiddlewareHandler } from "hono";

/**
 * Security headers middleware — based on vetconnect/security-spec
 * Headers: X-Content-Type-Options, X-Frame-Options, HSTS,
 * Referrer-Policy, Permissions-Policy, Cache-Control
 */
export const securityHeaders: MiddlewareHandler = async (c, next) => {
  await next();

  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  c.header("Cache-Control", "no-store");
  c.header(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'"
  );
};
