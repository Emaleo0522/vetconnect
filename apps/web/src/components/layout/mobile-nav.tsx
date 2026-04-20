"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { NAV_ITEMS } from "./sidebar";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="inline-flex h-9 w-9 items-center justify-center rounded transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        aria-label="Abrir menu de navegacion"
      >
        <Menu className="h-5 w-5" style={{ color: "var(--warm-700)" }} />
      </SheetTrigger>

      {/* Drawer left — mobile only */}
      <SheetContent
        side="left"
        className="w-[80vw] max-w-xs p-0"
        style={{ background: "var(--forest-900)" }}
      >
        <SheetTitle className="sr-only">Menu de navegacion</SheetTitle>

        {/* Logo — clickeable, navega a /dashboard */}
        <Link
          href="/dashboard"
          onClick={() => setOpen(false)}
          className="flex h-16 items-center gap-3 px-6"
          style={{ borderBottom: "1px solid rgb(31 60 46 / 0.35)" }}
          aria-label="Ir al inicio"
        >
          <Image
            src="/logo/logo-monogram-light.svg"
            alt="VetConnect"
            width={28}
            height={28}
            className="shrink-0"
          />
          <span
            className="text-base font-medium"
            style={{ fontFamily: "var(--font-fraunces)", color: "var(--cream-200)" }}
          >
            VetConnect
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 pt-4" aria-label="Menu principal mobile">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn("nav-item", isActive && "active")}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
