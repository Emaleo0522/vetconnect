import Link from "next/link";
import { PawPrint, Home } from "lucide-react";

export default function NotFound() {
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
          {/* Large editorial number */}
          <p
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontStyle: "italic",
              fontSize: "7rem",
              fontWeight: 300,
              lineHeight: 1,
              color: "var(--forest-200, #C5D9B8)",
              marginBottom: "0.5rem",
              userSelect: "none",
            }}
            aria-hidden="true"
          >
            404
          </p>

          <PawPrint
            style={{ color: "var(--forest-400, #8FA87B)", width: 32, height: 32, marginBottom: "1rem" }}
            aria-hidden="true"
          />

          <h1
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontStyle: "italic",
              fontSize: "1.625rem",
              fontWeight: 500,
              color: "var(--warm-900, #1A1A18)",
              marginBottom: "0.5rem",
            }}
          >
            Página no encontrada
          </h1>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "var(--warm-600, #5A5852)",
              maxWidth: "26rem",
              marginBottom: "2rem",
              lineHeight: 1.6,
            }}
          >
            La página que buscás no existe o fue movida. Volvé al inicio y continuá desde ahí.
          </p>
          <Link
            href="/dashboard"
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
              textDecoration: "none",
            }}
          >
            <Home style={{ width: 14, height: 14 }} aria-hidden="true" />
            Ir al inicio
          </Link>
        </div>
      </body>
    </html>
  );
}
