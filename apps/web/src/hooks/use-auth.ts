"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth";

/**
 * Hook to access auth state and check session on mount.
 * Should be called once in the root provider/layout.
 */
export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    store.checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return store;
}

/**
 * Hook that only returns auth state (no session check).
 * Use in child components that don't need to trigger session validation.
 */
export function useAuthState() {
  return useAuthStore();
}
