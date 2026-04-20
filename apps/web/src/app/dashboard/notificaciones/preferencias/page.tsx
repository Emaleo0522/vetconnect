"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Check } from "lucide-react";
import { api } from "@/lib/api";

interface NotifPreferences {
  vaccination: boolean;
  appointment: boolean;
  lost_nearby: boolean;
  community_reply: boolean;
  community_like: boolean;
  info: boolean;
}

const PREF_CONFIG: Array<{
  key: keyof NotifPreferences;
  label: string;
  description: string;
}> = [
  {
    key: "vaccination",
    label: "Recordatorios de vacunas",
    description: "Avisamos cuando una vacuna de tu mascota está próxima a vencer.",
  },
  {
    key: "appointment",
    label: "Turnos próximos",
    description: "Recordatorios antes de un turno con el veterinario.",
  },
  {
    key: "lost_nearby",
    label: "Animales perdidos cercanos",
    description: "Alertas cuando se reporta un animal perdido en tu zona.",
  },
  {
    key: "community_reply",
    label: "Respuestas en comunidad",
    description: "Cuando alguien responde a tu publicación o comentario.",
  },
  {
    key: "community_like",
    label: "Me gusta en comunidad",
    description: "Cuando alguien le da me gusta a tu publicación.",
  },
  {
    key: "info",
    label: "Novedades y actualizaciones",
    description: "Información general de VetConnect.",
  },
];

const DEFAULT_PREFS: NotifPreferences = {
  vaccination: true,
  appointment: true,
  lost_nearby: true,
  community_reply: true,
  community_like: false,
  info: false,
};

export default function NotificacionesPreferenciasPage() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotifPreferences>(DEFAULT_PREFS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrefs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<NotifPreferences>("/api/notifications/preferences");
      setPrefs(data);
    } catch {
      // Use defaults if endpoint not ready
      setPrefs(DEFAULT_PREFS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  function toggle(key: keyof NotifPreferences) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }

  async function savePrefs() {
    setIsSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.put("/api/notifications/preferences", prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("No se pudieron guardar las preferencias.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-3 flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: "var(--warm-400)", fontFamily: "var(--font-inter)" }}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </button>
        <h1
          className="text-2xl font-medium italic leading-tight"
          style={{ fontFamily: "var(--font-fraunces)", color: "var(--warm-900)" }}
        >
          Preferencias de notificaciones
        </h1>
        <p
          className="mt-0.5 text-sm"
          style={{ fontFamily: "var(--font-inter)", color: "var(--warm-400)" }}
        >
          Elegí qué notificaciones querés recibir dentro de la app.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-md p-4"
              style={{ border: "1px solid var(--border)", background: "white" }}
              aria-hidden="true"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="h-4 w-48 rounded" style={{ background: "var(--cream-200)" }} />
                  <div className="h-3 w-64 rounded" style={{ background: "var(--cream-100)" }} />
                </div>
                <div className="h-6 w-10 rounded-full" style={{ background: "var(--cream-200)" }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {PREF_CONFIG.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 rounded-md bg-white p-4"
              style={{ border: "1px solid var(--border)" }}
            >
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium"
                  style={{ fontFamily: "var(--font-inter)", color: "var(--warm-900)" }}
                >
                  {item.label}
                </p>
                <p
                  className="mt-0.5 text-xs"
                  style={{ fontFamily: "var(--font-inter)", color: "var(--warm-400)" }}
                >
                  {item.description}
                </p>
              </div>

              {/* Toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={prefs[item.key]}
                onClick={() => toggle(item.key)}
                className="relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors"
                style={{
                  background: prefs[item.key] ? "var(--forest-900)" : "var(--warm-200)",
                }}
                aria-label={`${item.label}: ${prefs[item.key] ? "activado" : "desactivado"}`}
              >
                <span
                  className="absolute h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
                  style={{
                    transform: prefs[item.key] ? "translateX(22px)" : "translateX(2px)",
                  }}
                />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Nota: solo in-app */}
      <p
        className="rounded-md px-4 py-3 text-xs"
        style={{
          background: "var(--cream-100)",
          color: "var(--warm-600)",
          fontFamily: "var(--font-inter)",
          border: "1px solid var(--border)",
        }}
      >
        Por ahora estas preferencias aplican solo a notificaciones dentro de la app.
        Las notificaciones push y por email están planificadas para una versión futura.
      </p>

      {error && (
        <p
          className="rounded-md px-4 py-2 text-sm"
          style={{
            background: "var(--terracotta-100)",
            color: "var(--terracotta-700)",
            fontFamily: "var(--font-inter)",
            border: "1px solid var(--terracotta-200)",
          }}
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Save button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={savePrefs}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          style={{
            background: "var(--forest-900)",
            color: "var(--cream-50)",
            fontFamily: "var(--font-inter)",
          }}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : saved ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : null}
          {isSaving ? "Guardando..." : saved ? "¡Guardado!" : "Guardar preferencias"}
        </button>
      </div>
    </div>
  );
}
