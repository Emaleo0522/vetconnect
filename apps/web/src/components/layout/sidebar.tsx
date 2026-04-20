"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  Home,
  PawPrint,
  MapPin,
  Stethoscope,
  CalendarDays,
  MessageCircle,
  Bell,
} from "lucide-react";

// Nav items — Inicio + 6 módulos D.1–D.6 (rutas finales)
export const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: Home, exact: true },
  { href: "/dashboard/pets", label: "Mi mascota", icon: PawPrint },
  { href: "/dashboard/perdidos", label: "Animales perdidos", icon: MapPin },
  { href: "/dashboard/veterinarios", label: "Veterinarios", icon: Stethoscope },
  { href: "/dashboard/turnos", label: "Turnos", icon: CalendarDays },
  { href: "/dashboard/comunidad", label: "Comunidad", icon: MessageCircle },
  { href: "/dashboard/notificaciones", label: "Notificaciones", icon: Bell, badge: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchUnread() {
      try {
        const data = await api.get<{ count: number }>("/api/notifications/unread-count");
        setUnreadCount(data.count);
      } catch {
        // silent — endpoint puede no existir aún
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside
      className="hidden lg:flex lg:flex-col"
      style={{ width: "var(--sidebar-width)", background: "var(--forest-900)" }}
      aria-label="Navegación principal"
    >
      {/* Logo — clickeable, navega a /dashboard */}
      <Link
        href="/dashboard"
        className="flex h-16 shrink-0 items-center gap-3 px-6"
        style={{ borderBottom: "1px solid rgb(var(--forest-900-rgb, 31 60 46) / 0.35)" }}
        aria-label="Ir al inicio"
      >
        <Image
          src="/logo/logo-monogram-light.svg"
          alt="VetConnect"
          width={32}
          height={32}
          className="shrink-0"
          priority
        />
        <span
          className="text-base font-medium tracking-tight"
          style={{ fontFamily: "var(--font-fraunces)", color: "var(--cream-200)" }}
        >
          VetConnect
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-3 pt-4" aria-label="Menu principal">
        {NAV_ITEMS.map((item) => {
          // Para items con exact:true (ej: Inicio → /dashboard), solo activo si coincide exactamente.
          // Para el resto, activo si la ruta actual comienza con el href del item.
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "nav-item",
                isActive && "active",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <span>{item.label}</span>
              {item.badge && unreadCount > 0 && (
                <span
                  className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
                  style={{
                    background: "var(--terracotta-500)",
                    color: "#FFFFFF",
                    fontFamily: "var(--font-inter)",
                  }}
                  aria-label={`${unreadCount} notificaciones sin leer`}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer sidebar */}
      <div
        className="px-4 py-4 text-xs"
        style={{
          borderTop: "1px solid rgb(var(--forest-900-rgb, 31 60 46) / 0.35)",
          color: "var(--forest-400)",
          fontFamily: "var(--font-inter)",
        }}
      >
        VetConnect Global
      </div>
    </aside>
  );
}

export { NAV_ITEMS as default };
