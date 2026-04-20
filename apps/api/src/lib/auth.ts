import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins/jwt";
import { admin } from "better-auth/plugins/admin";
import { bearer } from "better-auth/plugins/bearer";
import { db } from "../db/client.js";
import * as schema from "../db/schema/index.js";
import { env } from "./env.js";

// ---------------------------------------------------------------------------
// Access Control — 4 roles: owner, vet, org, admin
// ---------------------------------------------------------------------------
// Better Auth admin plugin handles role column + RBAC.
// We define our 4 roles with the admin plugin's `roles` option.
// Permissions are enforced at the middleware layer (requireRole).

// Derive the public-facing base URL — BETTER_AUTH_URL in production, fallback to localhost
const resolvedBaseURL =
  env.BETTER_AUTH_URL ?? `http://localhost:${env.PORT}`;

// Determine if we are running in production (for Secure cookie)
const isProduction = env.NODE_ENV === "production";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TS2742: zod v4 internal type not portable
export const auth: any = betterAuth({
  baseURL: resolvedBaseURL,
  basePath: "/api/auth",
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    `http://localhost:${env.PORT}`,
    ...env.CORS_ORIGINS.split(",").map((o) => o.trim()),
  ],

  // --- Database ---
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  // --- Email/Password ---
  emailAndPassword: {
    enabled: true,
    // autoSignIn is true so Better Auth creates the session on sign-up.
    // The /api/users/register/* endpoints call sign-up internally and
    // forward the session token — no manual sign-in needed post-register.
    autoSignIn: true,
  },

  // --- Cookie config (T10) ---
  // Cross-origin: Netlify (frontend) <-> VPS (API)
  // Requires SameSite=None; Secure; HttpOnly for cross-site cookies.
  // useSecureCookies: true makes Better Auth add __Secure- prefix automatically.
  // Do NOT set cookiePrefix manually — it would double-prefix (e.g. __Secure-__Secure-).
  advanced: {
    useSecureCookies: isProduction,
    crossSubdomainCookies: {
      enabled: false, // different domains, not subdomains
    },
    defaultCookieAttributes: isProduction
      ? {
          httpOnly: true,
          secure: true,
          sameSite: "none" as const,
          path: "/",
        }
      : {
          httpOnly: true,
          secure: false,
          sameSite: "lax" as const,
          path: "/",
        },
  },

  // --- Session config ---
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,      // refresh every 24h
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // --- User fields ---
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "owner",
        input: true,
      },
    },
  },

  // --- Plugins ---
  plugins: [
    // JWT plugin — signs sessions as JWTs for stateless verification
    jwt({
      jwt: {
        issuer: "vetconnect-api",
        audience: "vetconnect-app",
        expirationTime: "15m",
        definePayload: ({ user, session }) => ({
          sub: user.id,
          email: user.email,
          role: (user as Record<string, unknown>).role ?? "owner",
          sessionId: session.id,
        }),
      },
    }),

    // Bearer plugin — converts Authorization: Bearer <token> to session cookie
    bearer(),

    // Admin plugin — adds role, banned, banReason, banExpires to users
    admin({
      defaultRole: "owner",
      adminRoles: ["admin"],
    }),
  ],
});

// Export auth type for middleware and route type inference
export type Auth = typeof auth;
