import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  fetchNotifications,
  markAsRead,
  fetchUnreadCount,
} from "@/services/notifications";
import { useAuthStore } from "@/stores/auth.store";
import type { Notification } from "@vetconnect/shared/types/notifications";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;
export const UNREAD_COUNT_QUERY_KEY = ["notifications", "unread-count"] as const;

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export function useNotificationsQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<Notification[]>({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: fetchNotifications,
    enabled: isAuthenticated,
  });
}

// ---------------------------------------------------------------------------
// Unread count
// ---------------------------------------------------------------------------

export function useUnreadCountQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<number>({
    queryKey: UNREAD_COUNT_QUERY_KEY,
    queryFn: fetchUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 30_000, // poll every 30s
  });
}

// ---------------------------------------------------------------------------
// Mark as read
// ---------------------------------------------------------------------------

export function useMarkAsRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
    },
  });
}
