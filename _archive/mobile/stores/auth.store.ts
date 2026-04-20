import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { api, ApiError } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserRole = "owner" | "vet" | "org" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthState {
  token: string | null;
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Secure token helpers (SecureStore on native, AsyncStorage fallback on web)
// ---------------------------------------------------------------------------

const TOKEN_KEY = "vetconnect-token";
const USER_KEY = "vetconnect-user";

async function saveSecure(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.setItem(key, value);
    } catch {
      // localStorage not available
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getSecure(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function deleteSecure(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

// ---------------------------------------------------------------------------
// Register endpoint by role
// ---------------------------------------------------------------------------

function getRegisterEndpoint(role: UserRole): string {
  switch (role) {
    case "owner":
      return "/api/users/register/owner";
    case "vet":
      return "/api/users/register/vet";
    case "org":
      return "/api/users/register/org";
    default:
      return "/api/users/register/owner";
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>()((set, get) => ({
  token: null,
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true, // starts true until checkSession finishes
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<AuthResponse>(
        "/api/auth/sign-in/email",
        { email, password },
      );
      await saveSecure(TOKEN_KEY, res.token);
      await saveSecure(USER_KEY, JSON.stringify(res.user));
      set({
        token: res.token,
        user: res.user,
        role: res.user.role,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "An unexpected error occurred";
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  register: async (data, role) => {
    set({ isLoading: true, error: null });
    try {
      const endpoint = getRegisterEndpoint(role);
      const res = await api.post<AuthResponse>(endpoint, data);
      await saveSecure(TOKEN_KEY, res.token);
      await saveSecure(USER_KEY, JSON.stringify(res.user));
      set({
        token: res.token,
        user: res.user,
        role: res.user.role,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "An unexpected error occurred";
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  logout: async () => {
    await deleteSecure(TOKEN_KEY);
    await deleteSecure(USER_KEY);
    set({
      token: null,
      user: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const token = await getSecure(TOKEN_KEY);
      const userJson = await getSecure(USER_KEY);

      if (token && userJson) {
        const user: User = JSON.parse(userJson);
        set({
          token,
          user,
          role: user.role,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      // Corrupt data — clear everything
      await deleteSecure(TOKEN_KEY);
      await deleteSecure(USER_KEY);
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
