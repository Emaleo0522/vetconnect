"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatsCard } from "@/components/dashboard/stats-card";
import {
  PawPrint,
  Bell,
  Star,
  CalendarDays,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface PatientData {
  id: string;
  name: string;
  photo: string | null;
  species: string;
  breed: string | null;
}

interface ScheduleItem {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface VetProfile {
  name: string;
  clinicName: string;
  specialties: string[];
  isEmergency24h: boolean;
  avgRating: number | null;
  reviewCount: number;
  license: string;
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function VetDashboard() {
  const user = useAuthStore((s) => s.user);

  const [patients, setPatients] = useState<PatientData[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [profile, setProfile] = useState<VetProfile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [patientsRes, notifRes, profileRes] = await Promise.allSettled([
          api.get<{ items: PatientData[] }>("/api/pets/my-patients?limit=6"),
          api.get<{ count: number }>("/api/notifications/unread-count"),
          api.get<VetProfile>("/api/users/me/profile"),
        ]);

        if (patientsRes.status === "fulfilled") setPatients(patientsRes.value.items);
        if (notifRes.status === "fulfilled") setUnreadCount(notifRes.value.count);
        if (profileRes.status === "fulfilled") {
          setProfile(profileRes.value);
          // Fetch schedule using the vet's own ID
          try {
            const sched = await api.get<ScheduleItem[]>(`/api/vets/${user?.id}/schedule`);
            setSchedule(sched);
          } catch {
            // No schedule yet
          }
        }
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [user?.id]);

  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const activeScheduleDays = schedule.filter((s) => s.isActive).length;
  const profileComplete = profile?.clinicName && profile?.specialties?.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold">
          Hola, Dr/a. {user?.name?.split(" ")[0] ?? ""}!
        </h1>
        <p className="text-sm capitalize text-muted-foreground">{today}</p>
      </div>

      {/* Profile incomplete warning */}
      {!loading && !profileComplete && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Completá tu perfil profesional para que los dueños puedan encontrarte.
              </p>
            </div>
            <Link href="/dashboard/profile" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 border-amber-400")}>
              Completar perfil
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Mis pacientes"
          value={loading ? "--" : patients.length}
          icon={<PawPrint className="h-5 w-5 text-primary" />}
        />
        <StatsCard
          title="Días de atención"
          value={loading ? "--" : (activeScheduleDays > 0 ? activeScheduleDays : "Sin horarios")}
          icon={<CalendarDays className="h-5 w-5 text-emerald-500" />}
          highlight={activeScheduleDays === 0 && !loading}
        />
        <StatsCard
          title="Valoración"
          value={loading ? "--" : (profile?.avgRating != null ? `${profile.avgRating} ★` : "Sin reseñas")}
          icon={<Star className="h-5 w-5 text-amber-400" />}
        />
        <StatsCard
          title="Notificaciones"
          value={loading ? "--" : unreadCount}
          icon={<Bell className="h-5 w-5 text-blue-500" />}
          highlight={unreadCount > 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent patients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <PawPrint className="h-5 w-5 text-primary" />
              Mis pacientes
            </CardTitle>
            <Link href="/dashboard/patients" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : patients.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6">
                <PawPrint className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Todavía no tenés pacientes vinculados.
                </p>
                <p className="text-xs text-muted-foreground">
                  Los dueños te vinculan desde el perfil de su mascota.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {patients.map((pet) => (
                  <Link
                    key={pet.id}
                    href={`/dashboard/pets/${pet.id}`}
                    className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <PawPrint className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-none">{pet.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground capitalize">
                        {pet.species}{pet.breed ? ` · ${pet.breed}` : ""}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <CalendarDays className="h-5 w-5 text-primary" />
              Mis horarios
            </CardTitle>
            <Link href="/dashboard/schedule" className="text-sm text-primary hover:underline">
              Gestionar
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : schedule.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6">
                <CalendarDays className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No configuraste tus horarios.</p>
                <Link href="/dashboard/schedule" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-1")}>
                  Configurar horarios
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {schedule.map((item) => (
                  <div
                    key={item.dayOfWeek}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      {item.isActive ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      <span className="text-sm font-medium w-8">
                        {DAY_NAMES[item.dayOfWeek]}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {item.isActive
                        ? `${item.startTime} – ${item.endTime}`
                        : "No disponible"}
                    </span>
                  </div>
                ))}
                {profile?.isEmergency24h && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950/30">
                    <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Guardia 24h activa
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base">Accesos rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link href="/dashboard/patients" className={cn(buttonVariants({ variant: "outline" }), "h-auto flex-col gap-1.5 py-4")}>
              <PawPrint className="h-5 w-5" />
              <span>Ver pacientes</span>
            </Link>
            <Link href="/dashboard/schedule" className={cn(buttonVariants({ variant: "outline" }), "h-auto flex-col gap-1.5 py-4")}>
              <CalendarDays className="h-5 w-5" />
              <span>Mis horarios</span>
            </Link>
            <Link href={`/dashboard/vets/${user?.id}`} className={cn(buttonVariants({ variant: "outline" }), "h-auto flex-col gap-1.5 py-4")}>
              <Star className="h-5 w-5" />
              <span>Ver mi perfil</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
