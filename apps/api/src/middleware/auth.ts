import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { auth } from "../lib/auth.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** User role union — matches userRoleEnum in DB schema */
export type UserRole = "owner" | "vet" | "org" | "admin";

/** Authenticated user extracted from session */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  image?: string | null;
  phone?: string | null;
  banned?: boolean | null;
}

/** Session metadata */
export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  impersonatedBy?: string | null;
}

// ---------------------------------------------------------------------------
// Hono Variables — extends c.get('user'), c.get('session')
// ---------------------------------------------------------------------------

export type AuthVariables = {
  user: AuthUser;
  session: AuthSession;
};

// ---------------------------------------------------------------------------
// authGuard — verifies session, rejects 401 if invalid
// ---------------------------------------------------------------------------

/**
 * Middleware that verifies the user session via Better Auth.
 * On success, sets `c.var.user` and `c.var.session`.
 * On failure, throws 401.
 *
 * Works with both cookie-based sessions and Bearer tokens
 * (the bearer plugin converts Authorization header to cookie internally).
 */
export const authGuard = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session || !session.user) {
      throw new HTTPException(401, {
        message: "Authentication required",
      });
    }

    // Check if user is banned
    const user = session.user as Record<string, unknown>;
    if (user.banned === true) {
      throw new HTTPException(403, {
        message: "Account suspended",
      });
    }

    // Set user and session in Hono context
    c.set("user", {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: (user.role as UserRole) ?? "owner",
      image: session.user.image ?? null,
      phone: (user.phone as string) ?? null,
      banned: (user.banned as boolean) ?? false,
    });

    c.set("session", {
      id: session.session.id,
      userId: session.session.userId,
      token: session.session.token,
      expiresAt: session.session.expiresAt,
      impersonatedBy:
        (session.session as Record<string, unknown>).impersonatedBy as
          | string
          | null ?? null,
    });

    await next();
  }
);

// ---------------------------------------------------------------------------
// requireRole — role-based access control middleware
// ---------------------------------------------------------------------------

/**
 * Middleware factory that checks if the authenticated user has one of
 * the allowed roles. Must be used AFTER authGuard.
 *
 * @example
 * app.get("/admin/users", authGuard, requireRole("admin"), handler);
 * app.post("/pets", authGuard, requireRole("owner", "vet"), handler);
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const user = c.get("user");

    if (!user) {
      throw new HTTPException(401, {
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(user.role)) {
      throw new HTTPException(403, {
        message: "Insufficient permissions",
      });
    }

    await next();
  });
}
