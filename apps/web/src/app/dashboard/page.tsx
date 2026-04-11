"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/stats-card";
import { UpcomingVaccines } from "@/components/dashboard/upcoming-vaccines";
import { PetCard } from "@/components/pets/pet-card";
import {
  PawPrint,
  Syringe,
  Stethoscope,
  Bell,
  Star,
  MapPin,
  Clock,
} from "lucide-react";

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
  image: string | null;
  specialties: string[];
  clinicName: string;
  clinicAddress: string;
  isEmergency24h: boolean;
  avgRating: number | null;
  reviewCount: number;
}

interface UpcomingVaccine {
  petName: string;
  vaccineName: string;
  nextDoseDate: string;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const [pets, setPets] = useState<PetData[]>([]);
  const [vets, setVets] = useState<VetData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [upcomingVaccines, setUpcomingVaccines] = useState<UpcomingVaccine[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [petsRes, vetsRes, notifRes] = await Promise.allSettled([
          api.get<{ items: PetData[] }>("/api/pets"),
          api.get<VetData[]>("/api/vets?limit=3"),
          api.get<{ count: number }>("/api/notifications/unread-count"),
        ]);

        if (petsRes.status === "fulfilled") {
          setPets(petsRes.value.items);

          // Fetch vaccinations for each pet to build upcoming list
          const vaccinePromises = petsRes.value.items.map(async (pet) => {
            try {
              const vaccs = await api.get<
                Array<{
                  name: string;
                  nextDoseDate: string | null;
                }>
              >(`/api/pets/${pet.id}/vaccinations`);
              return vaccs
                .filter((v) => v.nextDoseDate)
                .map((v) => ({
                  petName: pet.name,
                  vaccineName: v.name,
                  nextDoseDate: v.nextDoseDate!,
                }));
            } catch {
              return [];
            }
          });

          const vaccineResults = await Promise.all(vaccinePromises);
          const allVaccines = vaccineResults.flat();
          allVaccines.sort(
            (a, b) =>
              new Date(a.nextDoseDate).getTime() -
              new Date(b.nextDoseDate).getTime(),
          );
          setUpcomingVaccines(allVaccines);
        }

        if (vetsRes.status === "fulfilled") {
          setVets(vetsRes.value);
        }

        if (notifRes.status === "fulfilled") {
          setUnreadCount(notifRes.value.count);
        }
      } catch {
        // Errors handled per-request via allSettled
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
    year: "numeric",
  });

  const vaccineCount = upcomingVaccines.filter((v) => {
    const date = new Date(v.nextDoseDate);
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffDays <= 30;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold">
          Bienvenido, {user?.name?.split(" ")[0] ?? ""}!
        </h1>
        <p className="text-sm capitalize text-muted-foreground">{today}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Mascotas"
          value={loading ? "--" : pets.length}
          icon={<PawPrint className="h-5 w-5 text-primary" />}
        />
        <StatsCard
          title="Vacunas proximas"
          value={loading ? "--" : vaccineCount}
          icon={<Syringe className="h-5 w-5 text-amber-500" />}
          highlight={vaccineCount > 0}
        />
        <StatsCard
          title="Veterinario"
          value={loading ? "--" : vets[0]?.name ?? "Sin asignar"}
          icon={<Stethoscope className="h-5 w-5 text-emerald-500" />}
        />
        <StatsCard
          title="Notificaciones"
          value={loading ? "--" : unreadCount}
          icon={<Bell className="h-5 w-5 text-blue-500" />}
          highlight={unreadCount > 0}
        />
      </div>

      {/* Pets Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Mis mascotas</h2>
          <Link
            href="/dashboard/pets"
            className="text-sm text-primary hover:underline"
          >
            Ver todas
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        ) : pets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-8">
              <PawPrint className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Aún no tenés mascotas registradas.
              </p>
              <Link
                href="/dashboard/pets/new"
                className="text-sm font-medium text-primary hover:underline"
              >
                Registrar mi primera mascota
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet) => (
              <PetCard key={pet.id} {...pet} />
            ))}
          </div>
        )}
      </div>

      {/* Two-column layout: Vaccines + Vets */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Vaccines */}
        <UpcomingVaccines vaccines={upcomingVaccines} isLoading={loading} />

        {/* Nearby Vets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Stethoscope className="h-5 w-5 text-primary" />
              Veterinarios cercanos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            ) : vets.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No se encontraron veterinarios.
              </p>
            ) : (
              <div className="space-y-3">
                {vets.map((vet) => (
                  <Link
                    key={vet.id}
                    href={`/dashboard/vets/${vet.id}`}
                    className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium">{vet.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {vet.clinicName}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {vet.clinicAddress}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {vet.avgRating !== null && (
                          <span className="flex items-center gap-1 text-sm font-medium">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {vet.avgRating}
                          </span>
                        )}
                        {vet.isEmergency24h && (
                          <Badge
                            variant="outline"
                            className="gap-1 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                          >
                            <Clock className="h-3 w-3" />
                            24h
                          </Badge>
                        )}
                      </div>
                    </div>
                    {vet.specialties.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {vet.specialties.map((s) => (
                          <Badge
                            key={s}
                            variant="secondary"
                            className="text-xs"
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
