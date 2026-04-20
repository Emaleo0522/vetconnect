"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { PetCard } from "@/components/pets/pet-card";
import { Syringe, MapPin, Star, Clock, Plus, Calendar } from "lucide-react";

interface PetData {
  id: string;
  name: string;
  photo: string | null;
  species: string;
  breed: string | null;
  birthDate: string | null;
  weight: string | null;
}

interface VetData {
  id: string;
  name: string;
  specialties: string[];
  clinicName: string;
  clinicAddress: string;
  isEmergency24h: boolean;
  avgRating: number | null;
}

interface UpcomingAppointment {
  id: string;
  vetName: string;
  petName: string;
  scheduledAt: string;
}

interface AppointmentsResponse {
  items: UpcomingAppointment[];
}

interface UpcomingVaccine {
  petName: string;
  vaccineName: string;
  nextDoseDate: string;
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div
      className="card-editorial p-5"
      style={{ borderLeft: highlight ? "3px solid var(--terracotta-500)" : undefined }}
    >
      <p
        className="text-xs uppercase tracking-wider"
        style={{ fontFamily: "var(--font-inter)", color: "var(--warm-400)" }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-2xl"
        style={{
          fontFamily: "var(--font-fraunces)",
          fontStyle: "italic",
          color: highlight ? "var(--terracotta-700)" : "var(--warm-900)",
          fontWeight: 400,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [pets, setPets] = useState<PetData[]>([]);
  const [vets, setVets] = useState<VetData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [upcomingVaccines, setUpcomingVaccines] = useState<UpcomingVaccine[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [petsRes, vetsRes, notifRes, apptRes] = await Promise.allSettled([
          api.get<{ items: PetData[] }>("/api/pets"),
          api.get<VetData[]>("/api/vets?limit=3"),
          api.get<{ count: number }>("/api/notifications/unread-count"),
          api.get<AppointmentsResponse>("/api/appointments?status=scheduled&limit=3"),
        ]);

        if (petsRes.status === "fulfilled") {
          const items = petsRes.value.items;
          setPets(items);
          // Vacunas próximas
          const vaccPromises = items.map(async (pet) => {
            try {
              const vaccs = await api.get<Array<{ name: string; nextDoseDate: string | null }>>(
                `/api/pets/${pet.id}/vaccinations`,
              );
              return vaccs
                .filter((v) => v.nextDoseDate)
                .map((v) => ({ petName: pet.name, vaccineName: v.name, nextDoseDate: v.nextDoseDate! }));
            } catch {
              return [];
            }
          });
          const results = (await Promise.all(vaccPromises)).flat();
          results.sort((a, b) => new Date(a.nextDoseDate).getTime() - new Date(b.nextDoseDate).getTime());
          setUpcomingVaccines(results.slice(0, 5));
        }
        if (vetsRes.status === "fulfilled") setVets(vetsRes.value ?? []);
        if (notifRes.status === "fulfilled") setUnreadCount(notifRes.value.count ?? 0);
        if (apptRes.status === "fulfilled") {
          const now = new Date();
          const upcoming = (apptRes.value.items ?? []).filter(
            (a) => new Date(a.scheduledAt) >= now,
          );
          upcoming.sort(
            (a, b) =>
              new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
          );
          setUpcomingAppointments(upcoming.slice(0, 3));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const vaccinesSoon = upcomingVaccines.filter((v) => {
    const diff = Math.ceil((new Date(v.nextDoseDate).getTime() - Date.now()) / 86_400_000);
    return diff <= 30;
  }).length;

  return (
    <div className="space-y-10">
      {/* Header editorial */}
      <div className="border-b pb-6" style={{ borderColor: "var(--border)" }}>
        <h1
          className="text-4xl"
          style={{
            fontFamily: "var(--font-fraunces)",
            fontStyle: "italic",
            color: "var(--warm-900)",
            fontWeight: 300,
            letterSpacing: "-0.02em",
          }}
        >
          Hola, {user?.name?.split(" ")[0] ?? "bienvenido"}
        </h1>
        <p
          className="mt-1 text-sm capitalize"
          style={{ fontFamily: "var(--font-inter)", color: "var(--warm-400)" }}
        >
          {today}
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-warm" style={{ height: "80px" }} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Mascotas" value={pets.length} />
          <Stat label="Vacunas próximas" value={vaccinesSoon} highlight={vaccinesSoon > 0} />
          <Stat label="Notificaciones" value={unreadCount} highlight={unreadCount > 0} />
          <Stat label="Veterinarios disponibles" value={vets.length || "—"} />
        </div>
      )}

      {/* Próximo turno badge (T34) */}
      {!loading && upcomingAppointments.length > 0 && (
        <Link
          href="/dashboard/turnos"
          className="flex items-center gap-4 rounded-xl px-5 py-3.5 transition-all"
          style={{
            background: "var(--forest-50)",
            border: "1px solid var(--forest-200)",
          }}
          aria-label={`Próximo turno: ${upcomingAppointments[0].vetName}`}
        >
          <Calendar
            className="h-5 w-5 shrink-0"
            style={{ color: "var(--forest-600)" }}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-medium"
              style={{ fontFamily: "var(--font-inter)", color: "var(--forest-800)" }}
            >
              Próximo turno: {upcomingAppointments[0].vetName}
            </p>
            <p
              className="text-xs"
              style={{ fontFamily: "var(--font-inter)", color: "var(--forest-600)" }}
            >
              {upcomingAppointments[0].petName} ·{" "}
              {new Date(upcomingAppointments[0].scheduledAt).toLocaleDateString(
                "es-AR",
                { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" },
              )}
            </p>
          </div>
          <span
            className="shrink-0 text-xs font-medium"
            style={{ color: "var(--forest-700)", fontFamily: "var(--font-inter)" }}
          >
            Ver turnos →
          </span>
        </Link>
      )}

      {/* Mascotas */}
      <section>
        <div
          className="mb-5 flex items-center justify-between border-b pb-3"
          style={{ borderColor: "var(--border)" }}
        >
          <h2
            className="text-xl"
            style={{ fontFamily: "var(--font-fraunces)", fontStyle: "italic", color: "var(--warm-900)", fontWeight: 400 }}
          >
            Mis mascotas
          </h2>
          <Link
            href="/dashboard/pets"
            className="text-sm hover:underline"
            style={{ fontFamily: "var(--font-inter)", color: "var(--forest-700)" }}
          >
            Ver todas
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton-warm" style={{ height: "96px" }} />)}
          </div>
        ) : pets.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-lg italic" style={{ fontFamily: "var(--font-fraunces)", color: "var(--warm-600)", fontWeight: 300 }}>
              Aun no tenés mascotas registradas
            </p>
            <Link
              href="/dashboard/pets/new"
              className="flex items-center gap-1.5 rounded px-4 py-2.5 text-sm font-medium"
              style={{ background: "var(--forest-900)", color: "var(--cream-25)", fontFamily: "var(--font-inter)" }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Agregar mascota
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet) => <PetCard key={pet.id} {...pet} />)}
          </div>
        )}
      </section>

      {/* Two-col: Vacunas + Vets */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Vacunas próximas */}
        <section className="card-editorial p-6">
          <div
            className="mb-4 flex items-center gap-2 pb-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <Syringe className="h-4 w-4" style={{ color: "var(--terracotta-500)" }} aria-hidden="true" />
            <h2
              className="text-base font-medium"
              style={{ fontFamily: "var(--font-fraunces)", color: "var(--warm-900)" }}
            >
              Vacunas próximas
            </h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton-warm" style={{ height: "40px" }} />)}
            </div>
          ) : upcomingVaccines.length === 0 ? (
            <p className="py-4 text-center text-sm" style={{ fontFamily: "var(--font-inter)", color: "var(--warm-400)" }}>
              Sin vacunas próximas. ¡Todo al día!
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingVaccines.map((v, i) => {
                const diff = Math.ceil((new Date(v.nextDoseDate).getTime() - Date.now()) / 86_400_000);
                const urgent = diff < 0 || diff <= 30;
                return (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium" style={{ fontFamily: "var(--font-inter)", color: "var(--warm-900)" }}>
                        {v.vaccineName}
                      </p>
                      <p className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}>
                        {v.petName}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-xs"
                      style={{
                        background: urgent ? "var(--terracotta-100)" : "var(--cream-100)",
                        color: urgent ? "var(--terracotta-700)" : "var(--warm-700)",
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {diff < 0 ? "Vencida" : formatDateShort(v.nextDoseDate)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Veterinarios cercanos */}
        <section className="card-editorial p-6">
          <div
            className="mb-4 flex items-center gap-2 pb-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <MapPin className="h-4 w-4" style={{ color: "var(--forest-600)" }} aria-hidden="true" />
            <h2
              className="text-base font-medium"
              style={{ fontFamily: "var(--font-fraunces)", color: "var(--warm-900)" }}
            >
              Veterinarios cercanos
            </h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton-warm" style={{ height: "60px" }} />)}
            </div>
          ) : vets.length === 0 ? (
            <p className="py-4 text-center text-sm" style={{ fontFamily: "var(--font-inter)", color: "var(--warm-400)" }}>
              No se encontraron veterinarios.
            </p>
          ) : (
            <div className="space-y-3">
              {vets.map((vet) => (
                <Link
                  key={vet.id}
                  href={`/dashboard/vets/${vet.id}`}
                  className="block rounded transition-colors"
                  style={{ padding: "10px 12px", border: "1px solid var(--border)", background: "var(--cream-25)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--forest-400)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-inter)", color: "var(--warm-900)" }}>
                        {vet.name}
                      </h4>
                      <p className="text-xs truncate" style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}>
                        {vet.clinicName}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {vet.avgRating !== null && (
                        <span className="flex items-center gap-0.5 text-xs font-medium" style={{ color: "#C49A2A" }}>
                          <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                          {vet.avgRating}
                        </span>
                      )}
                      {vet.isEmergency24h && (
                        <span
                          className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ background: "var(--forest-50)", color: "var(--forest-700)", border: "1px solid var(--forest-200)" }}
                        >
                          <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                          24h
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
