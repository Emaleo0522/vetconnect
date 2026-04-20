"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Bell } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { useRouter, usePathname } from "next/navigation";
import { NotificationsDrawer } from "@/components/notificaciones/notifications-drawer";
import { useNotificationsCount } from "@/hooks/use-notifications-count";

// Breadcrumb labels — actualizado con rutas reales
const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Inicio",
  "/dashboard/pets": "Mi mascota",
  "/dashboard/perdidos": "Animales perdidos",
  "/dashboard/veterinarios": "Veterinarios",
  "/dashboard/turnos": "Turnos",
  "/dashboard/comunidad": "Comunidad",
  "/dashboard/notificaciones": "Notificaciones",
  "/dashboard/profile": "Mi perfil",
};

function useBreadcrumb(): string {
  const pathname = usePathname();
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  for (const [route, label] of Object.entries(ROUTE_LABELS)) {
    if (pathname.startsWith(route + "/")) return label;
  }
  return "Dashboard";
}

export function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const breadcrumb = useBreadcrumb();
  const [notifOpen, setNotifOpen] = useState(false);
  const { count: unreadCount } = useNotificationsCount();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <>
      <header
        className="flex shrink-0 items-center justify-between px-4 lg:px-6"
        style={{
          height: "var(--topbar-height)",
          background: "var(--cream-50)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Left: hamburger (mobile) + breadcrumb */}
        <div className="flex items-center gap-3">
          <MobileNav />
          <h2
            className="text-base font-medium tracking-tight"
            style={{
              fontFamily: "var(--font-fraunces)",
              fontStyle: "italic",
              color: "var(--warm-700)",
            }}
          >
            {breadcrumb}
          </h2>
        </div>

        {/* Right: notifications bell + user menu */}
        <div className="flex items-center gap-1">
          {/* Notifications bell */}
          <button
            type="button"
            onClick={() => setNotifOpen(true)}
            className="relative flex h-9 w-9 items-center justify-center rounded transition-colors hover:bg-cream-100"
            style={{ color: "var(--warm-600)" }}
            aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ""}`}
          >
            <Bell className="h-4.5 w-4.5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold"
                style={{
                  background: "var(--terracotta-500)",
                  color: "#fff",
                  fontFamily: "var(--font-inter)",
                }}
                aria-hidden="true"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex items-center gap-2 rounded px-2 py-1.5 text-sm font-medium transition-colors hover:bg-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Menu de usuario"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback
                  style={{
                    background: "var(--forest-900)",
                    color: "var(--cream-50)",
                    fontFamily: "var(--font-inter)",
                    fontSize: "11px",
                    fontWeight: 500,
                  }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span
                className="hidden sm:inline-block text-sm"
                style={{ color: "var(--warm-700)" }}
              >
                {user?.name ?? "Usuario"}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/profile")}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" aria-hidden="true" />
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Cerrar sesion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Notifications drawer (global) */}
      <NotificationsDrawer
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </>
  );
}
