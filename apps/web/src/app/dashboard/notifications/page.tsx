"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bell,
  BellOff,
  Calendar,
  Syringe,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  items: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  appointment: Calendar,
  vaccination: Syringe,
  review: MessageCircle,
  alert: AlertCircle,
  success: CheckCircle,
  info: Info,
};

const TYPE_COLORS: Record<string, string> = {
  appointment: "bg-primary/10 text-primary",
  vaccination: "bg-[#4CAF7D]/10 text-[#4CAF7D]",
  review: "bg-accent/10 text-accent-foreground",
  alert: "bg-destructive/10 text-destructive",
  success: "bg-[#4CAF7D]/10 text-[#4CAF7D]",
  info: "bg-info/10 text-info",
};

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 7) {
    return date.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
    });
  }
  if (diffDays > 0) return `hace ${diffDays}d`;
  if (diffHours > 0) return `hace ${diffHours}h`;
  if (diffMins > 0) return `hace ${diffMins}m`;
  return "ahora";
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<NotificationsResponse>("/api/notifications");
      setNotifications(data.items ?? []);
    } catch {
      // handled by api.ts
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function markAsRead(id: string) {
    setMarkingRead(id);
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch {
      // silent
    } finally {
      setMarkingRead(null);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Notificaciones</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} sin leer`
              : "Todas leidas"}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-3 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-muted" />
                    <div className="h-3 w-full rounded bg-muted" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <BellOff className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No hay notificaciones</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const IconComponent = TYPE_ICONS[notif.type] ?? Bell;
            const colorClass =
              TYPE_COLORS[notif.type] ?? "bg-muted text-muted-foreground";

            return (
              <Card
                key={notif.id}
                className={cn(
                  "transition-colors",
                  !notif.read && "border-primary/20 bg-primary/[0.02]",
                )}
              >
                <CardContent className="p-4">
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 text-left"
                    onClick={() => !notif.read && markAsRead(notif.id)}
                    disabled={notif.read || markingRead === notif.id}
                    aria-label={
                      notif.read
                        ? notif.title
                        : `Marcar como leida: ${notif.title}`
                    }
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        colorClass,
                      )}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3
                          className={cn(
                            "text-sm truncate",
                            !notif.read ? "font-semibold" : "font-medium",
                          )}
                        >
                          {notif.title}
                        </h3>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notif.body}
                      </p>
                    </div>

                    {!notif.read && (
                      <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                    )}
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
