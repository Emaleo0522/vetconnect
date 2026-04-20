"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { StarRating } from "@/components/vets/star-rating";
import { ScheduleTable } from "@/components/vets/schedule-table";
import { ReviewList, type Review } from "@/components/vets/review-list";
import { ReviewForm } from "@/components/vets/review-form";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  ExternalLink,
  Award,
} from "lucide-react";
import dynamic from "next/dynamic";

const VetMap = dynamic(
  () => import("@/components/vets/vet-map").then((m) => ({ default: m.VetMap })),
  { ssr: false, loading: () => <div className="flex h-[250px] items-center justify-center rounded-lg border border-border bg-muted/30"><p className="text-sm text-muted-foreground">Cargando mapa...</p></div> },
);

interface VetDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  license: string;
  specialties: string[];
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  latitude: string;
  longitude: string;
  isEmergency24h: boolean;
  bio: string | null;
  avgRating: number | null;
  reviewCount: number;
  createdAt: string;
}

interface ScheduleEntry {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface ScheduleResponse {
  schedule: ScheduleEntry[];
  isEmergency24h: boolean;
}

interface ReviewsResponse {
  // API returns array at top level from api.get unwrapping
}

export default function VetProfilePage() {
  const params = useParams();
  const vetId = params.id as string;
  const user = useAuthStore((s) => s.user);

  const [vet, setVet] = useState<VetDetail | null>(null);
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVet = useCallback(async () => {
    setIsLoading(true);
    try {
      const [vetData, scheduleData, reviewsData] = await Promise.all([
        api.get<VetDetail>(`/api/vets/${vetId}`),
        api.get<ScheduleResponse>(`/api/vets/${vetId}/schedule`),
        api.get<Review[]>(`/api/vets/${vetId}/reviews`),
      ]);
      setVet(vetData);
      setSchedule(scheduleData);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch {
      // handled by api.ts
    } finally {
      setIsLoading(false);
    }
  }, [vetId]);

  useEffect(() => {
    fetchVet();
  }, [fetchVet]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4 animate-pulse">
              <div className="h-20 w-20 rounded-full bg-muted" />
              <div className="flex-1 space-y-3">
                <div className="h-6 w-1/2 rounded bg-muted" />
                <div className="h-4 w-1/3 rounded bg-muted" />
                <div className="h-4 w-2/3 rounded bg-muted" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!vet) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/vets"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al directorio
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-muted-foreground">Veterinario no encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = vet.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isOwner = user?.role === "owner";

  const whatsappUrl = vet.clinicPhone
    ? `https://wa.me/${vet.clinicPhone.replace(/[^0-9+]/g, "").replace("+", "")}`
    : null;

  const mapsUrl = `https://www.google.com/maps?q=${vet.latitude},${vet.longitude}`;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/vets"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al directorio
      </Link>

      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Avatar className="h-20 w-20 shrink-0" size="lg">
              {vet.image && <AvatarImage src={vet.image} alt={vet.name} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <h1 className="font-heading text-xl font-bold">{vet.name}</h1>
                {vet.isEmergency24h && (
                  <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                    <Clock className="mr-1 h-3 w-3" />
                    Guardia 24h
                  </Badge>
                )}
              </div>

              <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                <MapPin className="h-4 w-4 shrink-0" />
                {vet.clinicName} — {vet.clinicAddress}
              </p>

              <div className="flex items-center justify-center gap-2 sm:justify-start">
                {vet.avgRating ? (
                  <>
                    <StarRating value={vet.avgRating} size="md" />
                    <span className="text-sm text-muted-foreground">
                      {vet.avgRating.toFixed(1)} ({vet.reviewCount}{" "}
                      {vet.reviewCount === 1 ? "resena" : "resenas"})
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Sin resenas aun
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: info + schedule */}
        <div className="space-y-6 lg:col-span-2">
          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informacion profesional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Matricula
                  </span>
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <Award className="h-4 w-4 text-primary" />
                    {vet.license}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Telefono clinica
                  </span>
                  <p className="text-sm font-medium">
                    {vet.clinicPhone || "No disponible"}
                  </p>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Direccion
                  </span>
                  <p className="text-sm">{vet.clinicAddress}</p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Especialidades
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {vet.specialties.map((spec) => (
                    <Badge
                      key={spec}
                      style={{
                        background: "var(--forest-50)",
                        color: "var(--forest-700)",
                        borderColor: "var(--forest-200)",
                      }}
                    >
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>

              {vet.bio && (
                <div className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Acerca de
                  </span>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {vet.bio}
                  </p>
                </div>
              )}

              {/* Contact buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                {vet.clinicPhone && (
                  <a
                    href={`tel:${vet.clinicPhone}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    <Phone className="mr-1.5 h-4 w-4" />
                    Llamar
                  </a>
                )}
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    <MessageCircle className="mr-1.5 h-4 w-4" />
                    WhatsApp
                  </a>
                )}
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  <ExternalLink className="mr-1.5 h-4 w-4" />
                  Google Maps
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          {schedule && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Horarios de atencion</CardTitle>
              </CardHeader>
              <CardContent>
                <ScheduleTable
                  schedule={schedule.schedule}
                  isEmergency24h={schedule.isEmergency24h}
                />
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Resenas ({reviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewList reviews={reviews} />
            </CardContent>
          </Card>

          {/* Review form - only for owners */}
          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dejar una resena</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewForm vetId={vetId} onReviewSubmitted={fetchVet} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: map */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ubicacion</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden rounded-b-lg">
              <VetMap
                vets={[
                  {
                    ...vet,
                    avgRating: vet.avgRating,
                    reviewCount: vet.reviewCount,
                  },
                ]}
                singleVet
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
