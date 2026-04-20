"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { X, Bell, BellOff, CheckCheck, Settings } from "lucide-react";
import { api } from "@/lib/api";
import { NotificationItem, type Notification } from "./notification-item";
import { cn } from "@/lib/utils";

interface NotificationsDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface NotificationsResponse {
  items: Notification[];
  pagination: { total: number };
}

export function NotificationsDrawer({ open, onClose }: NotificationsDrawerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [activeFilter, setActiveFilter] = useState<Notification["type"] | "all">("all");

  const fetchNotifications = useCallback(async () => {
    if (!open) return;
    setIsLoading(true);
    try {
      const data = await api.get<NotificationsResponse>("/api/notifications?limit=20");
      setNotifications(data.items ?? []);
    } catch {
      // Graceful: show empty state if endpoint not ready
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Prevent body scroll when open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await api.put(`/api/notifications/${id}/read`);
    } catch {
      // Rollback
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.put("/api/notifications/read-all");
    } catch {
      // Rollback
      setNotifications((prev) =>
        prev.map((n) => (unreadIds.includes(n.id) ? { ...n, read: false } : n))
      );
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filterTypes: Array<{ value: Notification["type"] | "all"; label: string }> = [
    { value: "all", label: "Todo" },
    { value: "vaccination", label: "Vacunas" },
    { value: "appointment", label: "Turnos" },
    { value: "lost_nearby", label: "Perdidos" },
    { value: "community_reply", label: "Comunidad" },
  ];

  const filtered =
    activeFilter === "all"
      ? notifications
      : notifications.filter((n) => n.type === activeFilter);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        style={{ background: "rgba(26, 26, 24, 0.4)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer — desktop: right panel 400px, mobile: bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Notificaciones"
        className={cn(
          "fixed z-50 flex flex-col transition-transform duration-200 ease-out",
          // Desktop: right side
          "lg:bottom-0 lg:right-0 lg:top-0 lg:w-[400px]",
          // Mobile: bottom sheet
          "bottom-0 left-0 right-0 max-h-[90vh] rounded-t-xl lg:rounded-none",
          open
            ? "translate-y-0 lg:translate-x-0"
            : "translate-y-full lg:translate-x-full lg:translate-y-0"
        )}
        style={{ background: "var(--cream-50)", borderLeft: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <Bell
              className="h-4 w-4"
              style={{ color: "var(--warm-600)" }}
              aria-hidden="true"
            />
            <h2
              className="text-base font-medium italic"
              style={{ fontFamily: "var(--font-fraunces)", color: "var(--warm-900)" }}
            >
              Notificaciones
            </h2>
            {unreadCount > 0 && (
              <span
                className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
                style={{
                  background: "var(--terracotta-500)",
                  color: "#fff",
                  fontFamily: "var(--font-inter)",
                }}
                aria-label={`${unreadCount} sin leer`}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                disabled={markingAll}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors disabled:opacity-50"
                style={{ color: "var(--forest-700)", fontFamily: "var(--font-inter)" }}
                aria-label="Marcar todo como leído"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Todo leído</span>
              </button>
            )}
            <Link
              href="/dashboard/notificaciones/preferencias"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded transition-colors"
              style={{ color: "var(--warm-400)" }}
              aria-label="Preferencias de notificaciones"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded transition-colors"
              style={{ color: "var(--warm-400)" }}
              aria-label="Cerrar notificaciones"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div
          className="flex shrink-0 gap-1 overflow-x-auto px-3 py-2"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          {filterTypes.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setActiveFilter(f.value)}
              className="shrink-0 rounded px-2.5 py-1 text-xs transition-colors"
              style={{
                fontFamily: "var(--font-inter)",
                fontWeight: activeFilter === f.value ? 600 : 400,
                background: activeFilter === f.value ? "var(--forest-900)" : "transparent",
                color: activeFilter === f.value ? "var(--cream-50)" : "var(--warm-600)",
                border: activeFilter === f.value ? "1px solid var(--forest-900)" : "1px solid transparent",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="space-y-2" aria-live="polite" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-md p-3"
                  style={{ border: "1px solid var(--border)", background: "white" }}
                  aria-hidden="true"
                >
                  <div className="flex gap-3">
                    <div className="h-9 w-9 rounded-md" style={{ background: "var(--cream-100)" }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-3/4 rounded" style={{ background: "var(--cream-200)" }} />
                      <div className="h-3 w-full rounded" style={{ background: "var(--cream-100)" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 rounded-md py-12 text-center"
              style={{ border: "1px solid var(--border)", background: "var(--cream-25)" }}
              aria-live="polite"
            >
              <BellOff
                className="h-8 w-8"
                style={{ color: "var(--warm-200)" }}
                aria-hidden="true"
              />
              <p
                className="text-sm italic"
                style={{ fontFamily: "var(--font-fraunces)", color: "var(--warm-600)" }}
              >
                Sin notificaciones
              </p>
            </div>
          ) : (
            <div className="space-y-2" aria-live="polite">
              {filtered.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onMarkRead={markAsRead}
                  compact
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="shrink-0 px-3 pb-4 pt-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <Link
            href="/dashboard/notificaciones"
            onClick={onClose}
            className="block w-full rounded-md py-2 text-center text-sm transition-colors"
            style={{
              fontFamily: "var(--font-inter)",
              color: "var(--forest-700)",
              border: "1px solid var(--border)",
              background: "white",
            }}
          >
            Ver todas las notificaciones
          </Link>
        </div>
      </div>
    </>
  );
}
