"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard/pets");
    } catch {
      // Error genérico — no revelar si email/password específicamente
      setError("Credenciales incorrectas. Verificá tu email y contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      id="main-content"
      className="flex min-h-screen"
      style={{ background: "var(--cream-50)" }}
    >
      {/* Panel izquierdo — decorativo (desktop only) */}
      <div
        className="hidden lg:flex lg:w-[45%] lg:flex-col lg:justify-between lg:p-12"
        style={{ background: "var(--forest-900)" }}
      >
        <Image
          src="/logo/logo-horizontal-dark.svg"
          alt="VetConnect Global"
          width={160}
          height={40}
          priority
        />
        <div>
          <blockquote
            className="text-2xl leading-relaxed"
            style={{
              fontFamily: "var(--font-fraunces)",
              fontStyle: "italic",
              color: "var(--cream-200)",
              fontWeight: 300,
            }}
          >
            &ldquo;Cuidamos juntos,<br />conectamos vidas.&rdquo;
          </blockquote>
          <p
            className="mt-4 text-sm"
            style={{ fontFamily: "var(--font-inter)", color: "var(--forest-400)" }}
          >
            La plataforma veterinaria que tu mascota merece.
          </p>
        </div>
        <p
          className="text-xs"
          style={{ fontFamily: "var(--font-inter)", color: "var(--forest-600)" }}
        >
          VetConnect Global &copy; 2026
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        {/* Logo mobile */}
        <div className="mb-10 lg:hidden">
          <Image
            src="/logo/logo-horizontal-light.svg"
            alt="VetConnect Global"
            width={140}
            height={35}
            priority
          />
        </div>

        <div className="w-full max-w-sm">
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
              Iniciar sesion
            </h1>
            <p
              className="mt-2 text-sm"
              style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}
            >
              Ingresa a tu cuenta de VetConnect
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Email */}
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
                aria-invalid={!!error}
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="label-editorial"
                >
                  Contraseña
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs transition-colors hover:underline"
                  style={{ fontFamily: "var(--font-inter)", color: "var(--forest-600)" }}
                >
                  Olvidaste la contraseña?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                className="input-editorial"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                aria-invalid={!!error}
              />
            </div>

            {/* Error inline — terracota-700 (WCAG AA) */}
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded px-4 py-3 text-sm font-medium transition-colors disabled:opacity-60"
              style={{
                background: loading ? "var(--forest-700)" : "var(--forest-900)",
                color: "var(--cream-25)",
                fontFamily: "var(--font-inter)",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p
            className="mt-8 text-center text-sm"
            style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}
          >
            No tenes cuenta?{" "}
            <Link
              href="/register"
              className="font-medium transition-colors hover:underline"
              style={{ color: "var(--forest-700)" }}
            >
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
