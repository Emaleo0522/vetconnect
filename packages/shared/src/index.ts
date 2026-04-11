/**
 * @vetconnect/shared
 * Shared types, constants, and utilities for VetConnect Global.
 */

export const APP_NAME = "VetConnect Global" as const;

export const API_VERSION = "v1" as const;

/**
 * Base API response wrapper.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ---------------------------------------------------------------------------
// Domain types (mirrors DB schema)
// ---------------------------------------------------------------------------
export * from "./types/index.js";

// ---------------------------------------------------------------------------
// Validators (Zod schemas + inferred types)
// ---------------------------------------------------------------------------
export * from "./validators/index.js";
