"use client";

import Link from "next/link";
import { Calendar, Syringe, MessageCircle, AlertTriangle, Heart, Bell, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Notification {
  id: string;
  type: "appointment" | "vaccination" | "lost_nearby" | "community_reply" | "community_like" | "info";
  title: string;
  description: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: {
    petName?: string;
    vetName?: string;
    date?: string;
  };
}

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  compact?: boolean;
}

const TYPE_CONFIG: Record<
  Notification["type"],
  { icon: React.ElementType; label: string; bg: string; iconColor: string }
> = {
  appointment: {
    icon: Calendar,
    label: "Turno",
    bg: "var(--forest-50)",
    iconColor: "var(--forest-700)",
  },
  vaccination: {
    icon: Syringe,
    label: "Vacuna",
    bg: "var(--cream-100)",
    iconColor: "var(--forest-600)",
  },
  lost_nearby: {
    icon: AlertTriangle,
    label: "Animal perdido",
    bg: "var(--terracotta-100)",
    iconColor: "var(--terracotta-700)",
  },
  community_reply: {
    icon: MessageCircle,
    label: "Comunidad",
    bg: "var(--forest-50)",
    iconColor: "var(--forest-600)",
  },
  community_like: {
    icon: Heart,
    label: "Me gusta",
    bg: "var(--terracotta-100)",
    iconColor: "var(--terracotta-600)",
  },
  info: {
    icon: Bell,
    label: "Info",
    bg: "var(--cream-100)",
    iconColor: "var(--warm-600)",
  },
};

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 7) {
    return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  }
  if (diffDays > 0) return `hace ${diffDays}d`;
  if (diffHours > 0) return `hace ${diffHours}h`;
  if (diffMins > 0) return `hace ${diffMins}m`;
  return "ahora";
}

export function NotificationItem({ notification, onMarkRead, compact = false }: NotificationItemProps) {
  const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.info;
  const IconComponent = config.icon;

  const content = (
    <div
      className={cn(
        "flex gap-3 transition-colors",
        compact ? "p-3" : "p-4",
        !notification.read && "bg-cream-25"
      )}
      style={!notification.read ? { background: "var(--cream-25)" } : {}}
    >
      {/* Icon editorial */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
        style={{ background: config.bg }}
        aria-hidden="true"
      >
        <IconComponent
          className="h-4 w-4"
          style={{ color: config.iconColor }}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn("text-sm leading-snug", !notification.read ? "font-semibold" : "font-medium")}
            style={{ fontFamily: "var(--font-inter)", color: "var(--warm-900)" }}
          >
            {notification.title}
          </p>
          <time
            className="shrink-0 text-[10px]"
            dateTime={notification.createdAt}
            style={{ color: "var(--warm-400)", fontFamily: "var(--font-inter)" }}
          >
            {timeAgo(notification.createdAt)}
          </time>
        </div>
        <p
          className={cn("mt-0.5 text-xs leading-relaxed", compact ? "line-clamp-1" : "line-clamp-2")}
          style={{ color: "var(--warm-600)", fontFamily: "var(--font-inter)" }}
        >
          {notification.description}
        </p>
        {!notification.read && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMarkRead(notification.id); }}
            className="mt-1.5 flex items-center gap-1 text-[10px] transition-colors"
            style={{ color: "var(--forest-600)", fontFamily: "var(--font-inter)" }}
            aria-label="Marcar como leída"
          >
            <Check className="h-3 w-3" aria-hidden="true" />
            Marcar leída
          </button>
        )}
      </div>

      {/* Unread dot */}
      {!notification.read && (
        <div
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
          style={{ background: "var(--terracotta-500)" }}
          aria-label="Sin leer"
        />
      )}
    </div>
  );

  if (notification.actionUrl) {
    return (
      <Link
        href={notification.actionUrl}
        className="block rounded-md hover:no-underline"
        style={{ border: "1px solid var(--border)" }}
        onClick={() => !notification.read && onMarkRead(notification.id)}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      className="rounded-md"
      style={{ border: "1px solid var(--border)" }}
    >
      {content}
    </div>
  );
}
