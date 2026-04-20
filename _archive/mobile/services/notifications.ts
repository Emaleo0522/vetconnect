import { api } from "@/lib/api";
import type { Notification } from "@vetconnect/shared/types/notifications";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NotificationsResponse {
  notifications: Notification[];
}

export interface UnreadCountResponse {
  count: number;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export async function fetchNotifications(): Promise<Notification[]> {
  const res = await api.get<any>("/api/notifications");
  const data = res.data || res;
  return data.notifications || data || [];
}

export async function markAsRead(id: string): Promise<void> {
  await api.put<any>(`/api/notifications/${id}/read`);
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await api.get<any>(
    "/api/notifications/unread-count",
  );
  const data = res.data || res;
  return data.count ?? 0;
}

export async function registerPushToken(
  token: string,
  platform: "ios" | "android",
): Promise<void> {
  await api.post<any>("/api/push-tokens", { token, platform });
}
