"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/dashboard/stats-card";
import {
  Building2,
  Bell,
  Stethoscope,
  Users,
  Heart,
  ArrowRight,
  Globe,
} from "lucide-react";

interface OrgProfile {
  name: string;
  orgName: string;
  orgType: string;
  address: string | null;
  website: string | null;
}

const ORG_TYPE_LABELS: Record<string, string> = {
  shelter: "Refugio",
  rescue: "Rescate",
  foundation: "Fundación",
  other: "Organización",
};

export function OrgDashboard() {
  const user = useAuthStore((s) => s.user);

  const [profile, setProfile] = useState<OrgProfile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [profileRes, notifRes] = await Promise.allSettled([
          api.get<OrgProfile>("/api/users/me/profile"),
          api.get<{ count: number }>("/api/notifications/unread-count"),
        ]);
        if (profileRes.status === "fulfilled") setProfile(profileRes.value);
        if (notifRes.status === "fulfilled") setUnreadCount(notifRes.value.count);
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

  const orgTypeLabel = profile?.orgType
    ? (ORG_TYPE_LABELS[profile.orgType] ?? "Organización")
    : "Organización";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold">
          {profile?.orgName ?? user?.name ?? "Mi Organización"}
        </h1>
        <p className="text-sm capitalize text-muted-foreground">{today}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Tipo"
          value={loading ? "--" : orgTypeLabel}
          icon={<Building2 className="h-5 w-5 text-primary" />}
        />
        <StatsCard
          title="Notificaciones"
          value={loading ? "--" : unreadCount}
          icon={<Bell className="h-5 w-5 text-blue-500" />}
          highlight={unreadCount > 0}
        />
        <StatsCard
          title="Estado"
          value="Activa"
          icon={<Heart className="h-5 w-5 text-rose-500" />}
        />
      </div>

      {/* Welcome card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="font-heading text-lg font-semibold">
                Bienvenido a VetConnect
              </h2>
              <p className="text-sm text-muted-foreground">
                Como organización de rescate y bienestar animal, podés conectarte con
                veterinarios de la plataforma y gestionar tu perfil institucional.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Org profile summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <Building2 className="h-5 w-5 text-primary" />
              Información de la organización
            </CardTitle>
            <Link href="/dashboard/profile" className="text-sm text-primary hover:underline">
              Editar
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Nombre</dt>
                  <dd className="font-medium">{profile?.orgName ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tipo</dt>
                  <dd className="font-medium">{orgTypeLabel}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Dirección</dt>
                  <dd className="font-medium">{profile?.address ?? "Sin configurar"}</dd>
                </div>
                {profile?.website && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Web</dt>
                    <dd className="font-medium flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" />
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate max-w-40"
                      >
                        {profile.website}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </CardContent>
        </Card>

        {/* What orgs can do */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <Users className="h-5 w-5 text-primary" />
              ¿Qué podés hacer?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/dashboard/vets"
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <Stethoscope className="h-5 w-5 shrink-0 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Buscar veterinarios</p>
                <p className="text-xs text-muted-foreground">
                  Encontrá profesionales para colaborar con tu organización
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <Building2 className="h-5 w-5 shrink-0 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Completar perfil</p>
                <p className="text-xs text-muted-foreground">
                  Agregá dirección, web y descripción de tu organización
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            <Link
              href="/dashboard/notificaciones"
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <Bell className="h-5 w-5 shrink-0 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Notificaciones</p>
                <p className="text-xs text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} sin leer` : "Sin notificaciones nuevas"}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
