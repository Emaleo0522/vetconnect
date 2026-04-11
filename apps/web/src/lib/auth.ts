/**
 * Auth store using Zustand.
 * Manages login, register, logout, and session state.
 * Uses Better Auth endpoints via the Hono API.
 */

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
  token: string | null;
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
  logout: () => void;
  checkSession: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string> | undefined),
    },
    credentials: "include",
  });

  const json = await res.json();

  if (!res.ok) {
    const msg =
      json?.error?.message ?? json?.message ?? "An error occurred";
    throw new Error(msg);
  }

  return json;
}

function persistAuth(user: AuthUser, token: string) {
  localStorage.setItem("vc_token", token);
  localStorage.setItem("vc_user", JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem("vc_token");
  localStorage.removeItem("vc_user");
}

function loadPersistedAuth(): { user: AuthUser | null; token: string | null } {
  if (typeof window === "undefined") return { user: null, token: null };
  try {
    const token = localStorage.getItem("vc_token");
    const userStr = localStorage.getItem("vc_user");
    if (token && userStr) {
      return { user: JSON.parse(userStr) as AuthUser, token };
    }
  } catch {
    // Corrupted data — clear
    clearAuth();
  }
  return { user: null, token: null };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      // Better Auth sign-in endpoint
      const response = await apiRequest<{
        token: string;
        user: Record<string, unknown>;
      }>("/api/auth/sign-in/email", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const user: AuthUser = {
        id: response.user.id as string,
        name: response.user.name as string,
        email: response.user.email as string,
        role: (response.user.role as UserRole) ?? "owner",
        image: (response.user.image as string) ?? null,
        phone: (response.user.phone as string) ?? null,
      };

      const token = response.token;
      persistAuth(user, token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  registerOwner: async (data) => {
    set({ isLoading: true });
    try {
      await apiRequest("/api/users/register/owner", {
        method: "POST",
        body: JSON.stringify(data),
      });
      // Auto-login after registration
      const loginResponse = await apiRequest<{
        token: string;
        user: Record<string, unknown>;
      }>("/api/auth/sign-in/email", {
        method: "POST",
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const user: AuthUser = {
        id: loginResponse.user.id as string,
        name: loginResponse.user.name as string,
        email: loginResponse.user.email as string,
        role: (loginResponse.user.role as UserRole) ?? "owner",
        image: (loginResponse.user.image as string) ?? null,
        phone: (loginResponse.user.phone as string) ?? null,
      };

      persistAuth(user, loginResponse.token);
      set({ user, token: loginResponse.token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  registerVet: async (data) => {
    set({ isLoading: true });
    try {
      await apiRequest("/api/users/register/vet", {
        method: "POST",
        body: JSON.stringify(data),
      });
      const loginResponse = await apiRequest<{
        token: string;
        user: Record<string, unknown>;
      }>("/api/auth/sign-in/email", {
        method: "POST",
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const user: AuthUser = {
        id: loginResponse.user.id as string,
        name: loginResponse.user.name as string,
        email: loginResponse.user.email as string,
        role: (loginResponse.user.role as UserRole) ?? "vet",
        image: (loginResponse.user.image as string) ?? null,
        phone: (loginResponse.user.phone as string) ?? null,
      };

      persistAuth(user, loginResponse.token);
      set({ user, token: loginResponse.token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  registerOrg: async (data) => {
    set({ isLoading: true });
    try {
      await apiRequest("/api/users/register/org", {
        method: "POST",
        body: JSON.stringify(data),
      });
      const loginResponse = await apiRequest<{
        token: string;
        user: Record<string, unknown>;
      }>("/api/auth/sign-in/email", {
        method: "POST",
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const user: AuthUser = {
        id: loginResponse.user.id as string,
        name: loginResponse.user.name as string,
        email: loginResponse.user.email as string,
        role: (loginResponse.user.role as UserRole) ?? "org",
        image: (loginResponse.user.image as string) ?? null,
        phone: (loginResponse.user.phone as string) ?? null,
      };

      persistAuth(user, loginResponse.token);
      set({ user, token: loginResponse.token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    clearAuth();
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  checkSession: async () => {
    const { user, token } = loadPersistedAuth();
    if (!user || !token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      // Verify session is still valid
      const res = await fetch(`${API_URL}/api/auth/get-session`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (!res.ok) {
        clearAuth();
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const session = await res.json();
      if (session?.user) {
        const updatedUser: AuthUser = {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role ?? "owner",
          image: session.user.image ?? null,
          phone: session.user.phone ?? null,
        };
        persistAuth(updatedUser, token);
        set({ user: updatedUser, token, isAuthenticated: true, isLoading: false });
      } else {
        clearAuth();
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      // Network error — keep persisted auth (offline)
      set({ user, token, isAuthenticated: true, isLoading: false });
    }
  },
}));
