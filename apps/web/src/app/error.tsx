"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to error monitoring (no console.log in production)
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[GlobalError]", error);
    }
  }, [error]);

  return (
    <html lang="es" dir="ltr">
      <body style={{ background: "var(--cream-50, #F5EFE0)", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <AlertTriangle
            style={{ color: "var(--terracotta-500, #C07A5A)", width: 40, height: 40, marginBottom: "1rem" }}
            aria-hidden="true"
          />
          <h1
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontStyle: "italic",
              fontSize: "1.75rem",
              fontWeight: 500,
              color: "var(--warm-900, #1A1A18)",
              marginBottom: "0.5rem",
            }}
          >
            Algo salió mal
          </h1>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "var(--warm-600, #5A5852)",
              maxWidth: "28rem",
              marginBottom: "2rem",
              lineHeight: 1.6,
            }}
          >
            Ocurrió un error inesperado. Podés intentar recargar la página o volver al inicio.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.625rem 1.25rem",
                borderRadius: "0.5rem",
                background: "var(--forest-900, #1F3C2E)",
                color: "var(--cream-50, #F5EFE0)",
                fontFamily: "system-ui, sans-serif",
                fontSize: "0.875rem",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
              }}
            >
              <RefreshCw style={{ width: 14, height: 14 }} aria-hidden="true" />
              Reintentar
            </button>
            <Link
              href="/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "0.625rem 1.25rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--border, rgba(31,60,46,0.12))",
                color: "var(--warm-700, #42403C)",
                fontFamily: "system-ui, sans-serif",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
                background: "white",
              }}
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
