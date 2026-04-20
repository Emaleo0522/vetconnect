/**
 * HTTP client for VetConnect API.
 * T10: Authentication via httpOnly cookies only — no localStorage, no Bearer header.
 *      credentials: 'include' sends the session cookie on every request.
 * T9:  Non-auth endpoints return {success, data} wrapper (custom routes).
 *      Better Auth endpoints return flat responses handled by auth.ts.
 *
 * FIX-BLOCKER2: 401 no longer redirects inline. Throws ApiError("UNAUTHORIZED")
 * instead. Centralized redirect is handled by UnauthorizedBoundary in the root
 * layout — this prevents infinite redirect loops when the dashboard checks auth
 * on load while the session cookie is valid but the custom API returns 401.
 */

import { getStoredToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Build Authorization header from stored bearer token (BLOCKER-4). */
function authHeader(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Emits a single custom DOM event so the root UnauthorizedBoundary can
 * redirect once — even if multiple concurrent requests returned 401.
 * Safe to call from SSR context (typeof window guard).
 */
export function emitUnauthorized(): void {
  if (typeof window === "undefined") return;
  // Deduplicate: if we are already on /login, do nothing
  if (window.location.pathname === "/login") return;
  window.dispatchEvent(new CustomEvent("vetconnect:unauthorized"));
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // T10: No Authorization header — session cookie sent automatically via credentials:'include'
  // T11: No localStorage reads
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...(options.headers as Record<string, string> | undefined),
    },
    credentials: "include", // httpOnly cookie cross-origin (SameSite=None; Secure)
  });

  // Handle 401 — throw without redirect. UnauthorizedBoundary handles navigation
  // centrally to prevent dashboard ↔ login infinite loops.
  if (res.status === 401) {
    emitUnauthorized();
    throw new ApiError("UNAUTHORIZED", "Session expired", 401);
  }

  const json: ApiResponse<T> = await res.json();

  if (!json.success || !res.ok) {
    throw new ApiError(
      json.error?.code ?? "UNKNOWN_ERROR",
      json.error?.message ?? "An unexpected error occurred",
      res.status,
      json.error?.details,
    );
  }

  return json.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),

  /** Upload a file via multipart/form-data */
  upload: async <T>(path: string, fieldName: string, file: File): Promise<T> => {
    const formData = new FormData();
    formData.append(fieldName, file);

    // Do NOT set Content-Type — browser sets it with boundary automatically
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      body: formData,
      headers: { ...authHeader() },
      credentials: "include",
    });

    if (res.status === 401) {
      emitUnauthorized();
      throw new ApiError("UNAUTHORIZED", "Session expired", 401);
    }

    const json: ApiResponse<T> = await res.json();

    if (!json.success || !res.ok) {
      throw new ApiError(
        json.error?.code ?? "UNKNOWN_ERROR",
        json.error?.message ?? "An unexpected error occurred",
        res.status,
        json.error?.details,
      );
    }

    return json.data as T;
  },
};
