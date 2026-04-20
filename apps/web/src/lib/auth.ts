/**
 * Auth store using Zustand.
 *
 * Hybrid session model (BLOCKER-4 fix, 2026-04-20):
 *   - Better Auth sign-in returns BOTH a cookie AND a bearer token (in body +
 *     `set-auth-token` response header).
 *   - Custom Hono routes (/api/pets, /api/appointments, etc) validate via
 *     `auth.api.getSession()` which accepts either cookie OR
 *     `Authorization: Bearer <token>`. In cross-origin localhost dev, the
 *     cookie path is unreliable — Bearer always works.
 *   - Strategy: persist the bearer token in localStorage and attach it as
 *     `Authorization` on every custom-route request. Cookies still get sent
 *     automatically (credentials:'include') as a secondary channel.
 */

const TOKEN_KEY = "vetconnect.auth.token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

import { create } from "zustand";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserRole = "owner" | "vet" | "org" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image: string | null;
  phone: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  registerOwner: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  registerVet: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    license: string;
    specialties: string[];
    clinicName: string;
    clinicAddress: string;
    clinicPhone: string;
    latitude: number;
    longitude: number;
  }) => Promise<void>;
  registerOrg: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    orgName: string;
    orgType: "shelter" | "rescue" | "foundation" | "other";
    address: string;
    website?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Fetch wrapper that always sends credentials (cookies) cross-origin.
 * Returns the parsed JSON body or throws with a readable error message.
 */
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string> | undefined),
    },
    credentials: "include", // send httpOnly cookie cross-origin
  });

  const json = await res.json();

  if (!res.ok) {
    // Better Auth errors: {error: {message}} or {message}
    const msg =
      json?.error?.message ?? json?.message ?? "An error occurred";
    throw new Error(msg);
  }

  return json as T;
}

/**
 * Sign in via Better Auth cookie endpoint.
 * Returns the AuthUser extracted from the response.
 * The session cookie is set by Better Auth in the response headers — the
 * browser stores it automatically (httpOnly, invisible to JS).
 */
async function signIn(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  const json = (await res.json()) as {
    user?: Record<string, unknown>;
    token?: string;
    error?: { message?: string };
    message?: string;
  };

  if (!res.ok || !json.user) {
    throw new Error(json.error?.message ?? json.message ?? "Credenciales incorrectas.");
  }

  // Capture bearer token (from response body OR set-auth-token header) for
  // custom-route Authorization headers.
  const token = json.token ?? res.headers.get("set-auth-token") ?? null;
  if (token) setStoredToken(token);

  return {
    id: json.user.id as string,
    name: json.user.name as string,
    email: json.user.email as string,
    role: (json.user.role as UserRole) ?? "owner",
    image: (json.user.image as string) ?? null,
    phone: (json.user.phone as string) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  // ---------------------------------------------------------------------------
  // login
  // ---------------------------------------------------------------------------
  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const user = await signIn(email, password);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // ---------------------------------------------------------------------------
  // registerOwner
  // ---------------------------------------------------------------------------
  registerOwner: async (data) => {
    set({ isLoading: true });
    try {
      // Step 1: Create account — returns {user} flat (T9)
      await apiFetch("/api/users/register/owner", {
        method: "POST",
        body: JSON.stringify(data),
      });

      // Step 2: Sign in to establish httpOnly cookie session (T10)
      // autoSignIn on the server creates the user but does NOT forward the
      // cookie to the browser (server-side HTTP call). Client must sign in.
      const user = await signIn(data.email, data.password);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // ---------------------------------------------------------------------------
  // registerVet
  // ---------------------------------------------------------------------------
  registerVet: async (data) => {
    set({ isLoading: true });
    try {
      await apiFetch("/api/users/register/vet", {
        method: "POST",
        body: JSON.stringify(data),
      });
      const user = await signIn(data.email, data.password);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // ---------------------------------------------------------------------------
  // registerOrg
  // ---------------------------------------------------------------------------
  registerOrg: async (data) => {
    set({ isLoading: true });
    try {
      await apiFetch("/api/users/register/org", {
        method: "POST",
        body: JSON.stringify(data),
      });
      const user = await signIn(data.email, data.password);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // ---------------------------------------------------------------------------
  // logout
  // ---------------------------------------------------------------------------
  logout: async () => {
    // Invalidate server-side session — clears the httpOnly cookie via Set-Cookie
    try {
      const token = getStoredToken();
      await fetch(`${API_URL}/api/auth/sign-out`, {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // Best-effort — clear client state regardless
    }
    setStoredToken(null);
    set({ user: null, isAuthenticated: false, isLoading: false });
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  // ---------------------------------------------------------------------------
  // checkSession
  // ---------------------------------------------------------------------------
  checkSession: async () => {
    try {
      // The browser sends the httpOnly cookie automatically with credentials:'include';
      // also attach bearer token if available (covers cross-origin dev where
      // cookies can't be trusted).
      const token = getStoredToken();
      const res = await fetch(`${API_URL}/api/auth/get-session`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const session = res.ok
        ? ((await res.json()) as {
            user: Record<string, unknown> | null;
            session: Record<string, unknown>;
          } | null)
        : null;

      if (session?.user) {
        const user: AuthUser = {
          id: session.user.id as string,
          name: session.user.name as string,
          email: session.user.email as string,
          role: (session.user.role as UserRole) ?? "owner",
          image: (session.user.image as string) ?? null,
          phone: (session.user.phone as string) ?? null,
        };
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      // No valid session (401) or network error — treat as unauthenticated
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
