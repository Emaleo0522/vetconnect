"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { BellOff, CheckCheck, Trash2, Archive, Settings } from "lucide-react";
import { api } from "@/lib/api";
import { NotificationItem, type Notification } from "@/components/notificaciones/notification-item";

type FilterType = Notification["type"] | "all";

const FILTER_LABELS: Record<FilterType, string> = {
  all: "Todo",
  vaccination: "Vacunas",
  appointment: "Turnos",
  lost_nearby: "Perdidos",
  community_reply: "Comunidad",
  community_like: "Me gusta",
  info: "Info",
};

interface NotificationsResponse {
  items: Notification[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function NotificacionesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async (p: number, filter: FilterType, replace = false) => {
    if (p === 1) setIsLoading(true);
    else setIsLoadingMore(true);
    try {
      const typeParam = filter !== "all" ? `&type=${filter}` : "";
      const data = await api.get<NotificationsResponse>(
        `/api/notifications?page=${p}&limit=20${typeParam}`
      );
      const items = data.items ?? [];
      setNotifications((prev) => (replace ? items : [...prev, ...items]));
      setHasMore((data.pagination?.page ?? p) < (data.pagination?.totalPages ?? 1));
    } catch {
      if (p === 1) setNotifications([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchNotifications(1, activeFilter, true);
  }, [activeFilter, fetchNotifications]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchNotifications(next, activeFilter, false);
  }

  async function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await api.put(`/api/notifications/${id}/read`);
    } catch {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.put("/api/notifications/read-all");
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (unreadIds.includes(n.id) ? { ...n, read: false } : n))
      );
    } finally {
      setMarkingAll(false);
    }
  }

  async function archiveNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await api.put(`/api/notifications/${id}/archive`);
    } catch {
      // silent — item visually removed
    }
  }

  async function deleteNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await api.delete(`/api/notifications/${id}`);
    } catch {
      // silent
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filters: FilterType[] = ["all", "vaccination", "appointment", "lost_nearby", "community_reply"];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-medium italic leading-tight"
            style={{ fontFamily: "var(--font-fraunces)", color: "var(--warm-900)" }}
          >
            Notificaciones
          </h1>
          <p
            className="mt-0.5 text-sm"
            style={{ fontFamily: "var(--font-inter)", color: "var(--warm-400)" }}
          >
            {unreadCount > 0
              ? `${unreadCount} sin leer`
              : "Todo al día"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors disabled:opacity-50"
              style={{
                fontFamily: "var(--font-inter)",
                border: "1px solid var(--border)",
                color: "var(--warm-700)",
                background: "white",
              }}
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Todo leído
            </button>
          )}
          <Link
            href="/dashboard/notificaciones/preferencias"
            className="flex h-9 w-9 items-center justify-center rounded-md transition-colors"
            style={{
              border: "1px solid var(--border)",
              color: "var(--warm-600)",
              background: "white",
            }}
            aria-label="Preferencias de notificaciones"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 overflow-x-auto pb-0.5" role="tablist" aria-label="Filtrar notificaciones">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={activeFilter === f}
            onClick={() => setActiveFilter(f)}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors"
            style={{
              fontFamily: "var(--font-inter)",
              fontWeight: activeFilter === f ? 600 : 400,
              background: activeFilter === f ? "var(--forest-900)" : "transparent",
              color: activeFilter === f ? "var(--cream-50)" : "var(--warm-600)",
              border: activeFilter === f ? "1px solid var(--forest-900)" : "1px solid var(--border)",
            }}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2" aria-live="polite" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-md p-4"
              style={{ border: "1px solid var(--border)", background: "white" }}
              aria-hidden="true"
            >
              <div className="flex gap-3">
                <div className="h-9 w-9 rounded-md" style={{ background: "var(--cream-100)" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/3 rounded" style={{ background: "var(--cream-200)" }} />
                  <div className="h-3 w-full rounded" style={{ background: "var(--cream-100)" }} />
                  <div className="h-3 w-4/5 rounded" style={{ background: "var(--cream-100)" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div
          className="flex flex-col items-center gap-4 rounded-md py-16 text-center"
          style={{ border: "1px solid var(--border)", background: "var(--cream-25)" }}
          aria-live="polite"
        >
          <BellOff
            className="h-10 w-10"
            style={{ color: "var(--warm-200)" }}
            aria-hidden="true"
          />
          <div>
            <p
              className="font-medium italic"
              style={{ fontFamily: "var(--font-fraunces)", color: "var(--warm-700)" }}
            >
              Sin notificaciones
            </p>
            <p
              className="mt-1 text-sm"
              style={{ fontFamily: "var(--font-inter)", color: "var(--warm-400)" }}
            >
              {activeFilter === "all"
                ? "Todas tus notificaciones aparecerán aquí."
                : "No hay notificaciones de este tipo."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2" aria-live="polite">
          {notifications.map((notif) => (
            <div key={notif.id} className="group relative">
              <NotificationItem
                notification={notif}
                onMarkRead={markAsRead}
              />
              {/* Swipe actions — shown on hover desktop */}
              <div
                className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 group-hover:flex"
                style={{ zIndex: 1 }}
              >
                <button
                  type="button"
                  onClick={() => archiveNotification(notif.id)}
                  className="flex h-7 w-7 items-center justify-center rounded transition-colors"
                  style={{ background: "var(--cream-100)", color: "var(--warm-600)" }}
                  aria-label="Archivar"
                >
                  <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteNotification(notif.id)}
                  className="flex h-7 w-7 items-center justify-center rounded transition-colors"
                  style={{ background: "var(--terracotta-100)", color: "var(--terracotta-700)" }}
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="rounded-md border px-5 py-2 text-sm transition-colors disabled:opacity-60"
                style={{
                  fontFamily: "var(--font-inter)",
                  borderColor: "var(--border)",
                  color: "var(--warm-700)",
                  background: "white",
                }}
              >
                {isLoadingMore ? "Cargando..." : "Cargar más"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
