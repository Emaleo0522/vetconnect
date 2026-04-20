"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, checkSession } = useAuthStore();
  const router = useRouter();
  // Guard against duplicate redirects from concurrent 401 responses
  const redirectingRef = useRef(false);

  // Verificar sesión al montar
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // FIX-BLOCKER2: Listen for vetconnect:unauthorized from api.ts.
  // Single centralized handler — prevents concurrent 401s from triggering
  // multiple redirects and breaking the dashboard ↔ login loop.
  useEffect(() => {
    function handleUnauthorized() {
      if (redirectingRef.current) return;
      redirectingRef.current = true;
      // Clear auth state so login page doesn't immediately redirect back
      useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
      router.replace("/login");
    }
    window.addEventListener("vetconnect:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("vetconnect:unauthorized", handleUnauthorized);
    };
  }, [router]);

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--cream-50)" }}
      >
        <div className="flex flex-col items-center gap-4">
          {/* Spinner editorial warm */}
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{
              borderColor: "var(--forest-200)",
              borderTopColor: "transparent",
              borderRightColor: "var(--forest-900)",
            }}
            role="status"
            aria-label="Cargando"
          />
          <span
            className="text-sm italic"
            style={{ fontFamily: "var(--font-source-serif)", color: "var(--warm-600)" }}
          >
            Cargando...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Sidebar desktop */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto"
          style={{ padding: "1.5rem 1.5rem" }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
