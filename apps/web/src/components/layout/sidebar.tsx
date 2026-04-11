"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  LayoutDashboard,
  PawPrint,
  Stethoscope,
  Syringe,
  Bell,
  User,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/pets", label: "Mascotas", icon: PawPrint },
  { href: "/dashboard/vets", label: "Veterinarios", icon: Stethoscope },
  { href: "/dashboard/vaccinations", label: "Vacunas", icon: Syringe },
  { href: "/dashboard/notifications", label: "Notificaciones", icon: Bell, badge: true },
  { href: "/dashboard/profile", label: "Perfil", icon: User },
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
        // silent
      }
    }
    fetchUnread();
    // Poll every 60s
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <PawPrint className="h-6 w-6 text-primary" strokeWidth={2.5} />
        <span className="font-heading text-lg font-bold text-sidebar-foreground">
          VetConnect
        </span>
      </div>

      <nav className="space-y-1 p-4" aria-label="Menu principal">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
              {item.badge && unreadCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export { NAV_ITEMS };
