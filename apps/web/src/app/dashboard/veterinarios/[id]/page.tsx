"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { StarRating } from "@/components/vets/star-rating";
import { ScheduleTable } from "@/components/vets/schedule-table";
import { ReviewList, type Review } from "@/components/vets/review-list";
import { ReviewForm } from "@/components/vets/review-form";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  ExternalLink,
  Award,
  Heart,
  Calendar,
} from "lucide-react";

const AppointmentModal = dynamic(
  () => import("@/components/turnos/appointment-modal").then((m) => ({ default: m.AppointmentModal })),
  { ssr: false }
);

const VetMap = dynamic(
  () =>
    import("@/components/vets/vet-map").then((m) => ({ default: m.VetMap })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{
          height: "250px",
          background: "var(--cream-100)",
          border: "1px solid var(--border)",
        }}
      >
        <p
          className="text-sm"
          style={{ color: "var(--warm-400)", fontFamily: "var(--font-inter)" }}
        >
          Cargando mapa...
        </p>
      </div>
    ),
  },
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

export default function VetProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const vetId = params.id as string;
  const user = useAuthStore((s) => s.user);

  const [vet, setVet] = useState<VetDetail | null>(null);
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const fetchVet = useCallback(async () => {
    setIsLoading(true);
    try {
      const [vetData, scheduleData, reviewsData, favData] = await Promise.allSettled([
        api.get<VetDetail>(`/api/vets/${vetId}`),
        api.get<ScheduleResponse>(`/api/vets/${vetId}/schedule`),
        api.get<Review[]>(`/api/vets/${vetId}/reviews`),
        api.get<{ isFavorite: boolean }>(`/api/users/me/favorites/${vetId}`),
      ]);

      if (vetData.status === "fulfilled") setVet(vetData.value);
      if (scheduleData.status === "fulfilled") setSchedule(scheduleData.value);
      if (reviewsData.status === "fulfilled")
        setReviews(
          Array.isArray(reviewsData.value) ? reviewsData.value : [],
        );
      if (favData.status === "fulfilled")
        setIsFavorite(favData.value.isFavorite ?? false);
    } catch {
      // handled by api.ts
    } finally {
      setIsLoading(false);
    }
  }, [vetId]);

  useEffect(() => {
    fetchVet();
  }, [fetchVet]);

  // Open modal if coming from list with ?agendar=1
  useEffect(() => {
    if (searchParams.get("agendar") === "1" && vet) {
      setShowScheduleModal(true);
    }
  }, [searchParams, vet]);

  async function handleToggleFavorite() {
    if (!vet) return;
    setFavLoading(true);
    const prev = isFavorite;
    setIsFavorite(!prev); // optimistic
    try {
      if (prev) {
        await api.delete(`/api/users/me/favorites/${vetId}`);
      } else {
        await api.post("/api/users/me/favorites", { vetProfileId: vetId });
      }
    } catch {
      setIsFavorite(prev); // revert
    } finally {
      setFavLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div
          className="skeleton-warm"
          style={{ height: "24px", width: "160px", borderRadius: "6px" }}
        />
        <div
          className="skeleton-warm"
          style={{ height: "200px", borderRadius: "12px" }}
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <div
            className="skeleton-warm lg:col-span-2"
            style={{ height: "300px", borderRadius: "12px" }}
          />
          <div
            className="skeleton-warm"
            style={{ height: "250px", borderRadius: "12px" }}
          />
        </div>
      </div>
    );
  }

  if (!vet) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/veterinarios"
          className="inline-flex items-center gap-1.5 text-sm hover:underline"
          style={{ fontFamily: "var(--font-inter)", color: "var(--forest-700)" }}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al directorio
        </Link>
        <div
          className="flex flex-col items-center gap-4 py-12 text-center"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "12px",
            background: "var(--cream-25)",
          }}
        >
          <p
            className="text-lg italic"
            style={{
              fontFamily: "var(--font-fraunces)",
              color: "var(--warm-600)",
              fontWeight: 300,
            }}
          >
            Veterinario no encontrado
          </p>
        </div>
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
      {/* Back */}
      <Link
        href="/dashboard/veterinarios"
        className="inline-flex items-center gap-1.5 text-sm hover:underline focus-visible:outline-none"
        style={{ fontFamily: "var(--font-inter)", color: "var(--forest-700)" }}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al directorio
      </Link>

      {/* Header */}
      <div
        className="overflow-hidden rounded-xl"
        style={{
          border: "1px solid var(--border)",
          background: "var(--cream-25)",
        }}
      >
        <div className="p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {/* Avatar */}
            {vet.image ? (
              <img
                src={vet.image}
                alt={vet.name}
                width={80}
                height={80}
                className="h-20 w-20 shrink-0 rounded-full object-cover"
                style={{ border: "3px solid var(--cream-100)" }}
              />
            ) : (
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: "var(--forest-900)",
                  border: "3px solid var(--cream-100)",
                }}
              >
                <span
                  className="text-2xl"
                  style={{
                    fontFamily: "var(--font-fraunces)",
                    fontStyle: "italic",
                    color: "var(--cream-25)",
                    fontWeight: 300,
                  }}
                >
                  {initials}
                </span>
              </div>
            )}

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                <div>
                  <h1
                    className="text-2xl"
                    style={{
                      fontFamily: "var(--font-fraunces)",
                      fontStyle: "italic",
                      color: "var(--warm-900)",
                      fontWeight: 400,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {vet.name}
                  </h1>
                  {vet.isEmergency24h && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        background: "var(--terracotta-100)",
                        color: "var(--terracotta-700)",
                        border: "1px solid var(--terracotta-200)",
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      Guardia 24h
                    </span>
                  )}
                </div>
                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    disabled={favLoading}
                    aria-label={
                      isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"
                    }
                    className="flex items-center gap-1.5 rounded px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                    style={{
                      border: `1px solid ${isFavorite ? "var(--terracotta-400)" : "var(--border)"}`,
                      background: isFavorite
                        ? "var(--terracotta-100)"
                        : "transparent",
                      color: isFavorite
                        ? "var(--terracotta-700)"
                        : "var(--warm-600)",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    <Heart
                      className="h-4 w-4"
                      style={{ fill: isFavorite ? "currentColor" : "none" }}
                      aria-hidden="true"
                    />
                    {isFavorite ? "Guardado" : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(true)}
                    className="flex items-center gap-1.5 rounded px-4 py-2 text-sm font-medium transition-colors"
                    style={{
                      background: "var(--forest-900)",
                      color: "var(--cream-25)",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                    Agendar turno
                  </button>
                </div>
              </div>

              <p
                className="flex items-center justify-center gap-1.5 text-sm sm:justify-start"
                style={{
                  fontFamily: "var(--font-inter)",
                  color: "var(--warm-600)",
                }}
              >
                <MapPin
                  className="h-4 w-4 shrink-0"
                  style={{ color: "var(--terracotta-400)" }}
                  aria-hidden="true"
                />
                {vet.clinicName} — {vet.clinicAddress}
              </p>

              <div className="flex items-center justify-center gap-2 sm:justify-start">
                {vet.avgRating ? (
                  <>
                    <StarRating value={vet.avgRating} size="md" />
                    <span
                      className="text-sm"
                      style={{
                        fontFamily: "var(--font-inter)",
                        color: "var(--warm-500)",
                      }}
                    >
                      {vet.avgRating.toFixed(1)} ({vet.reviewCount}{" "}
                      {vet.reviewCount === 1 ? "reseña" : "reseñas"})
                    </span>
                  </>
                ) : (
                  <span
                    className="text-sm"
                    style={{
                      fontFamily: "var(--font-inter)",
                      color: "var(--warm-400)",
                    }}
                  >
                    Sin reseñas aún
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left — info + schedule + reviews */}
        <div className="space-y-6 lg:col-span-2">
          {/* Professional info */}
          <div
            className="space-y-4 rounded-xl p-5"
            style={{
              border: "1px solid var(--border)",
              background: "var(--cream-25)",
            }}
          >
            <h2
              className="text-lg"
              style={{
                fontFamily: "var(--font-fraunces)",
                fontStyle: "italic",
                color: "var(--warm-900)",
                fontWeight: 400,
              }}
            >
              Información profesional
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <span
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{
                    fontFamily: "var(--font-inter)",
                    color: "var(--warm-400)",
                  }}
                >
                  Matrícula
                </span>
                <p
                  className="flex items-center gap-1.5 text-sm font-medium"
                  style={{
                    fontFamily: "var(--font-inter)",
                    color: "var(--warm-900)",
                  }}
                >
                  <Award
                    className="h-4 w-4"
                    style={{ color: "var(--forest-600)" }}
                    aria-hidden="true"
                  />
                  {vet.license}
                </p>
              </div>

              <div className="space-y-1">
                <span
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{
                    fontFamily: "var(--font-inter)",
                    color: "var(--warm-400)",
                  }}
                >
                  Teléfono clínica
                </span>
                <p
                  className="text-sm font-medium"
                  style={{
                    fontFamily: "var(--font-inter)",
                    color: "var(--warm-900)",
                  }}
                >
                  {vet.clinicPhone || "No disponible"}
                </p>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <span
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{
                    fontFamily: "var(--font-inter)",
                    color: "var(--warm-400)",
                  }}
                >
                  Dirección
                </span>
                <p
                  className="text-sm"
                  style={{
                    fontFamily: "var(--font-inter)",
                    color: "var(--warm-800)",
                  }}
                >
                  {vet.clinicAddress}
                </p>
              </div>
            </div>

            {/* Specialties — border tags (not filled pills) */}
            <div className="space-y-1">
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{
                  fontFamily: "var(--font-inter)",
                  color: "var(--warm-400)",
                }}
              >
                Especialidades
              </span>
              <div className="flex flex-wrap gap-1.5">
                {vet.specialties.map((spec) => (
                  <span
                    key={spec}
                    className="rounded px-2.5 py-1 text-sm"
                    style={{
                      border: "1px solid var(--forest-200)",
                      color: "var(--forest-700)",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Bio — Source Serif 4 editorial */}
            {vet.bio && (
              <div className="space-y-1">
                <span
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{
                    fontFamily: "var(--font-inter)",
                    color: "var(--warm-400)",
                  }}
                >
                  Acerca de
                </span>
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    fontFamily: "var(--font-inter)",
                    color: "var(--warm-700)",
                    lineHeight: "1.7",
                  }}
                >
                  {vet.bio}
                </p>
              </div>
            )}

            {/* Contact buttons */}
            <div
              className="flex flex-wrap gap-2 pt-2"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {vet.clinicPhone && (
                <a
                  href={`tel:${vet.clinicPhone}`}
                  className="flex items-center gap-1.5 rounded px-3 py-2 text-sm font-medium transition-colors"
                  style={{
                    border: "1px solid var(--border)",
                    color: "var(--warm-700)",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  Llamar
                </a>
              )}
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded px-3 py-2 text-sm font-medium transition-colors"
                  style={{
                    border: "1px solid var(--border)",
                    color: "var(--warm-700)",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  WhatsApp
                </a>
              )}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded px-3 py-2 text-sm font-medium transition-colors"
                style={{
                  border: "1px solid var(--border)",
                  color: "var(--warm-700)",
                  fontFamily: "var(--font-inter)",
                }}
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Google Maps
              </a>
            </div>
          </div>

          {/* Schedule */}
          {schedule && (
            <div
              className="space-y-3 rounded-xl p-5"
              style={{
                border: "1px solid var(--border)",
                background: "var(--cream-25)",
              }}
            >
              <h2
                className="text-lg"
                style={{
                  fontFamily: "var(--font-fraunces)",
                  fontStyle: "italic",
                  color: "var(--warm-900)",
                  fontWeight: 400,
                }}
              >
                Horarios de atención
              </h2>
              <ScheduleTable
                schedule={schedule.schedule}
                isEmergency24h={schedule.isEmergency24h}
              />
            </div>
          )}

          {/* Reviews */}
          <div
            className="space-y-3 rounded-xl p-5"
            style={{
              border: "1px solid var(--border)",
              background: "var(--cream-25)",
            }}
          >
            <h2
              className="text-lg"
              style={{
                fontFamily: "var(--font-fraunces)",
                fontStyle: "italic",
                color: "var(--warm-900)",
                fontWeight: 400,
              }}
            >
              Reseñas ({reviews.length})
            </h2>
            <ReviewList reviews={reviews} />
          </div>

          {/* Review form — only for owners */}
          {isOwner && (
            <div
              className="space-y-3 rounded-xl p-5"
              style={{
                border: "1px solid var(--border)",
                background: "var(--cream-25)",
              }}
            >
              <h2
                className="text-lg"
                style={{
                  fontFamily: "var(--font-fraunces)",
                  fontStyle: "italic",
                  color: "var(--warm-900)",
                  fontWeight: 400,
                }}
              >
                Dejar una reseña
              </h2>
              <ReviewForm vetId={vetId} onReviewSubmitted={fetchVet} />
            </div>
          )}
        </div>

        {/* Right — map */}
        <div className="space-y-5">
          <div
            className="overflow-hidden rounded-xl"
            style={{ border: "1px solid var(--border)" }}
          >
            <div
              className="px-4 py-3"
              style={{
                background: "var(--cream-25)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <h3
                className="text-sm font-medium"
                style={{
                  fontFamily: "var(--font-inter)",
                  color: "var(--warm-700)",
                }}
              >
                Ubicación
              </h3>
            </div>
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
          </div>
        </div>
      </div>

      {/* Appointment modal */}
      {showScheduleModal && (
        <AppointmentModal
          vetId={vetId}
          vetName={vet.name}
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => {
            setShowScheduleModal(false);
          }}
        />
      )}
    </div>
  );
}
