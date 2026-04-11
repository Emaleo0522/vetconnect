/** Notification type */
export type NotificationType = "vaccine_reminder" | "appointment" | "general";

/** Push token platform */
export type Platform = "ios" | "android";

/** Notification record */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: Date;
}

/** Device push token */
export interface PushToken {
  id: string;
  userId: string;
  token: string;
  platform: Platform;
  createdAt: Date;
}
