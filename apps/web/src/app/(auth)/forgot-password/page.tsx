"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Loader2, CheckCircle } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://vc-api.161-153-203-83.sslip.io";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Better Auth forgot-password endpoint
      await fetch(`${API_URL}/api/auth/forget-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      });
      // Siempre mostrar éxito — no revelar si el email existe
      setSent(true);
    } catch {
      setError("Error al enviar. Intenta de nuevo en unos minutos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center px-6 py-12"
      style={{ background: "var(--cream-50)" }}
    >
      <div className="mb-10">
        <Image
          src="/logo/logo-horizontal-light.svg"
          alt="VetConnect Global"
          width={140}
          height={35}
          priority
        />
      </div>

      <div className="w-full max-w-sm">
        <Link
          href="/login"
          className="mb-6 flex items-center gap-1 text-sm transition-colors hover:underline"
          style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Volver al login
        </Link>

        {sent ? (
          <div className="text-center">
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "var(--forest-50)" }}
            >
              <CheckCircle className="h-6 w-6" style={{ color: "var(--forest-700)" }} />
            </div>
            <h1
              className="mb-2 text-2xl"
              style={{
                fontFamily: "var(--font-fraunces)",
                fontStyle: "italic",
                color: "var(--warm-900)",
                fontWeight: 400,
              }}
            >
              Revisa tu email
            </h1>
            <p
              className="text-sm leading-relaxed"
              style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}
            >
              Si tu email esta registrado, recibiras instrucciones para restablecer tu contraseña en los proximos minutos.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1
                className="text-3xl"
                style={{
                  fontFamily: "var(--font-fraunces)",
                  fontStyle: "italic",
                  color: "var(--warm-900)",
                  fontWeight: 400,
                }}
              >
                Recuperar contraseña
              </h1>
              <p
                className="mt-2 text-sm"
                style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}
              >
                Te enviamos un link para restablecer tu contraseña.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="label-editorial"
                  style={{ display: "block" }}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input-editorial"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded px-3 py-2 text-sm"
                  style={{
                    background: "var(--terracotta-100)",
                    color: "var(--terracotta-700)",
                    fontFamily: "var(--font-inter)",
                    border: "1px solid var(--terracotta-200)",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="flex w-full items-center justify-center gap-2 rounded px-4 py-3 text-sm font-medium transition-colors disabled:opacity-60"
                style={{
                  background: "var(--forest-900)",
                  color: "var(--cream-25)",
                  fontFamily: "var(--font-inter)",
                  cursor: loading || !email ? "not-allowed" : "pointer",
                }}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {loading ? "Enviando..." : "Enviar instrucciones"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
