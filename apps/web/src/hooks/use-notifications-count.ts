"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

const POLL_INTERVAL = 30_000; // 30s

/**
 * Hook global que hace polling cada 30s al endpoint de unread count.
 * Usado por Header (badge) y Sidebar.
 * Graceful: si el endpoint no existe, retorna 0 silenciosamente.
 */
export function useNotificationsCount() {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const data = await api.get<{ count: number }>("/api/notifications/unread-count");
      setCount(data.count ?? 0);
    } catch {
      // Endpoint may not exist yet — graceful fallback to 0
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchCount]);

  return { count };
}
