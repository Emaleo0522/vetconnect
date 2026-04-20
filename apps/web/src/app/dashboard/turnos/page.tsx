"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import {
  Calendar,
  Clock,
  X,
  Stethoscope,
  RefreshCcw,
  Loader2,
} from "lucide-react";

type AppointmentStatus = "scheduled" | "completed" | "cancelled";

interface Appointment {
  id: string;
  vetId: string;
  vetName: string;
  petId: string;
  petName: string;
  scheduledAt: string;
  specialties: string[];
  reason: string | null;
  status: AppointmentStatus;
  createdAt: string;
}

interface AppointmentsResponse {
  items: Appointment[];
}

type TabKey = "upcoming" | "past" | "cancelled";

const TABS: { key: TabKey; label: string }[] = [
  { key: "upcoming", label: "Próximos" },
  { key: "past", label: "Pasados" },
  { key: "cancelled", label: "Cancelados" },
];

function formatDateTime(dateStr: string): { date: string; time: string } {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
    time: d.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = Math.ceil(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diff;
}

function AppointmentSkeleton() {
  return (
    <div
      className="skeleton-warm rounded-xl"
      style={{ height: "120px" }}
      aria-hidden="true"
    />
  );
}

interface AppointmentCardProps {
  appt: Appointment;
  tab: TabKey;
  onCancel: (id: string) => void;
  isCancelling: boolean;
}

function AppointmentCard({
  appt,
  tab,
  onCancel,
  isCancelling,
}: AppointmentCardProps) {
  const { date, time } = formatDateTime(appt.scheduledAt);
  const days = tab === "upcoming" ? daysUntil(appt.scheduledAt) : null;

  const statusStyles: Record<TabKey, React.CSSProperties> = {
    upcoming: {
      background: "var(--cream-25)",
      borderLeft: "3px solid var(--forest-900)",
    },
    past: {
      background: "var(--cream-25)",
      borderLeft: "3px solid var(--warm-200)",
    },
    cancelled: {
      background: "var(--cream-25)",
      borderLeft: "3px solid var(--terracotta-400)",
    },
  };

  return (
    <article
      className="rounded-xl p-4 transition-all"
      style={{
        ...statusStyles[tab],
        border: "1px solid var(--border)",
        borderLeft: statusStyles[tab].borderLeft,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          {/* Vet + pet */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3
              className={`text-base leading-tight ${tab === "cancelled" ? "" : ""}`}
              style={{
                fontFamily: "var(--font-fraunces)",
                fontStyle: "italic",
                color: tab === "cancelled" ? "var(--warm-500)" : "var(--warm-900)",
                fontWeight: 400,
                textDecoration: tab === "cancelled" ? "line-through" : "none",
                textDecorationColor: "var(--terracotta-400)",
              }}
            >
              {appt.vetName}
            </h3>
            <span
              className="rounded-full px-2 py-0.5 text-xs"
              style={{
                background: "var(--forest-50)",
                color: "var(--forest-700)",
                fontFamily: "var(--font-inter)",
                border: "1px solid var(--forest-200)",
              }}
            >
              {appt.petName}
            </span>
          </div>

          {/* Date + time */}
          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            <span
              className="flex items-center gap-1.5"
              style={{ color: "var(--warm-700)" }}
            >
              <Calendar
                className="h-3.5 w-3.5"
                style={{ color: "var(--warm-400)" }}
                aria-hidden="true"
              />
              {date}
            </span>
            <span
              className="flex items-center gap-1.5"
              style={{ color: "var(--warm-700)" }}
            >
              <Clock
                className="h-3.5 w-3.5"
                style={{ color: "var(--warm-400)" }}
                aria-hidden="true"
              />
              {time}
            </span>
            {/* Days until badge — upcoming only */}
            {tab === "upcoming" && days !== null && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  background:
                    days <= 1
                      ? "var(--terracotta-100)"
                      : days <= 3
                        ? "var(--cream-200)"
                        : "var(--cream-100)",
                  color:
                    days <= 1
                      ? "var(--terracotta-700)"
                      : days <= 3
                        ? "var(--warm-700)"
                        : "var(--warm-600)",
                  fontFamily: "var(--font-inter)",
                }}
              >
                {days === 0
                  ? "Hoy"
                  : days === 1
                    ? "Mañana"
                    : `En ${days} días`}
              </span>
            )}
          </div>

          {/* Specialties */}
          {appt.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {appt.specialties.slice(0, 2).map((s) => (
                <span
                  key={s}
                  className="rounded px-2 py-0.5 text-xs"
                  style={{
                    border: "1px solid var(--border)",
                    color: "var(--warm-500)",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Reason */}
          {appt.reason && (
            <p
              className="text-xs italic"
              style={{ color: "var(--warm-500)", fontFamily: "var(--font-inter)" }}
            >
              "{appt.reason}"
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col gap-2">
          <Link
            href={`/dashboard/veterinarios/${appt.vetId}`}
            className="flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              border: "1px solid var(--border)",
              color: "var(--warm-700)",
              fontFamily: "var(--font-inter)",
            }}
          >
            <Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />
            Ver vet
          </Link>
          {tab === "upcoming" && (
            <>
              <Link
                href={`/dashboard/veterinarios/${appt.vetId}?agendar=1`}
                className="flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  border: "1px solid var(--forest-300)",
                  color: "var(--forest-700)",
                  fontFamily: "var(--font-inter)",
                }}
              >
                <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reprogramar
              </Link>
              <button
                type="button"
                onClick={() => onCancel(appt.id)}
                disabled={isCancelling}
                className="flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                style={{
                  border: "1px solid var(--terracotta-200)",
                  color: "var(--terracotta-600)",
                  fontFamily: "var(--font-inter)",
                }}
              >
                {isCancelling ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default function TurnosPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<AppointmentsResponse>("/api/appointments");
      setAppointments(data.items ?? []);
    } catch {
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  async function handleCancel(id: string) {
    setCancellingId(id);
    setCancelError(null);
    try {
      await api.patch(`/api/appointments/${id}`, { status: "cancelled" });
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: "cancelled" as AppointmentStatus } : a,
        ),
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setCancelError(err.message);
      } else {
        setCancelError("Error al cancelar el turno");
      }
    } finally {
      setCancellingId(null);
    }
  }

  const now = new Date();

  const upcoming = appointments.filter(
    (a) => a.status === "scheduled" && new Date(a.scheduledAt) >= now,
  );
  const past = appointments.filter(
    (a) =>
      a.status === "completed" ||
      (a.status === "scheduled" && new Date(a.scheduledAt) < now),
  );
  const cancelled = appointments.filter((a) => a.status === "cancelled");

  const tabData: Record<TabKey, Appointment[]> = { upcoming, past, cancelled };
  const tabCounts: Record<TabKey, number> = {
    upcoming: upcoming.length,
    past: past.length,
    cancelled: cancelled.length,
  };

  const displayedAppointments = tabData[activeTab];

  const EMPTY_MESSAGES: Record<TabKey, string> = {
    upcoming: "Aún no agendaste turnos",
    past: "No hay turnos pasados",
    cancelled: "No hay turnos cancelados",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-3xl"
            style={{
              fontFamily: "var(--font-fraunces)",
              fontStyle: "italic",
              color: "var(--warm-900)",
              fontWeight: 300,
              letterSpacing: "-0.02em",
            }}
          >
            Mis turnos
          </h1>
          <p
            className="mt-1 text-sm"
            style={{
              fontFamily: "var(--font-inter)",
              color: "var(--warm-600)",
            }}
          >
            Tus consultas veterinarias agendadas
          </p>
        </div>
        <Link
          href="/dashboard/veterinarios"
          className="flex shrink-0 items-center gap-1.5 rounded px-4 py-2 text-sm font-medium transition-colors"
          style={{
            background: "var(--forest-900)",
            color: "var(--cream-25)",
            fontFamily: "var(--font-inter)",
          }}
        >
          <Calendar className="h-4 w-4" aria-hidden="true" />
          Agendar turno
        </Link>
      </div>

      {/* Tabs */}
      <div
        className="flex overflow-hidden rounded-xl"
        style={{ border: "1px solid var(--border)" }}
        role="tablist"
        aria-label="Estado de turnos"
      >
        {TABS.map((tab, i) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`tabpanel-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm transition-colors ${
              i > 0 ? "border-l" : ""
            }`}
            style={{
              borderColor: "var(--border)",
              background:
                activeTab === tab.key
                  ? "var(--forest-900)"
                  : "var(--cream-25)",
              color:
                activeTab === tab.key
                  ? "var(--cream-25)"
                  : "var(--warm-600)",
              fontFamily: "var(--font-inter)",
              fontWeight: activeTab === tab.key ? 500 : 400,
            }}
          >
            {tab.label}
            {!isLoading && tabCounts[tab.key] > 0 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-xs"
                style={{
                  background:
                    activeTab === tab.key
                      ? "rgba(255,255,255,0.2)"
                      : "var(--cream-200)",
                  color:
                    activeTab === tab.key ? "var(--cream-25)" : "var(--warm-700)",
                }}
              >
                {tabCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cancel error */}
      {cancelError && (
        <p
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            background: "var(--terracotta-100)",
            color: "var(--terracotta-700)",
            fontFamily: "var(--font-inter)",
            border: "1px solid var(--terracotta-200)",
          }}
          role="alert"
        >
          {cancelError}
        </p>
      )}

      {/* Content */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-label={`Turnos ${TABS.find((t) => t.key === activeTab)?.label ?? ""}`}
      >
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <AppointmentSkeleton key={i} />
            ))}
          </div>
        ) : displayedAppointments.length === 0 ? (
          <div
            className="flex flex-col items-center gap-4 py-16 text-center"
            role="status"
          >
            <Calendar
              className="h-12 w-12"
              style={{ color: "var(--warm-200)" }}
              aria-hidden="true"
            />
            <p
              className="text-lg italic"
              style={{
                fontFamily: "var(--font-fraunces)",
                color: "var(--warm-600)",
                fontWeight: 300,
              }}
            >
              {EMPTY_MESSAGES[activeTab]}
            </p>
            {activeTab === "upcoming" && (
              <Link
                href="/dashboard/veterinarios"
                className="rounded px-4 py-2 text-sm font-medium"
                style={{
                  background: "var(--forest-900)",
                  color: "var(--cream-25)",
                  fontFamily: "var(--font-inter)",
                }}
              >
                Buscar veterinario
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedAppointments.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                tab={activeTab}
                onCancel={handleCancel}
                isCancelling={cancellingId === appt.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
