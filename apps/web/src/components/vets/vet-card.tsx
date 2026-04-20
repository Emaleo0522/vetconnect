"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "./star-rating";
import { Clock, MapPin, Heart, Calendar } from "lucide-react";

export interface VetListItem {
  id: string;
  name: string;
  image: string | null;
  specialties: string[];
  clinicName: string;
  clinicAddress: string;
  isEmergency24h: boolean;
  avgRating: number | null;
  reviewCount: number;
  latitude?: string;
  longitude?: string;
  isFavorite?: boolean;
}

interface VetCardProps {
  vet: VetListItem;
  onToggleFavorite?: (vetId: string, current: boolean) => void;
  onSchedule?: (vetId: string) => void;
}

export function VetCard({ vet, onToggleFavorite, onSchedule }: VetCardProps) {
  const initials = vet.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <article
      className="card-editorial flex flex-col overflow-hidden"
      style={{ borderRadius: "12px" }}
    >
      <div className="flex gap-4 p-4">
        {/* Avatar */}
        <Avatar className="h-16 w-16 shrink-0" size="lg">
          {vet.image && <AvatarImage src={vet.image} alt={vet.name} />}
          <AvatarFallback
            style={{
              background: "var(--forest-900)",
              color: "var(--cream-25)",
              fontSize: "18px",
              fontFamily: "var(--font-fraunces)",
              fontStyle: "italic",
            }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3
              className="truncate text-base leading-tight"
              style={{
                fontFamily: "var(--font-fraunces)",
                fontStyle: "italic",
                color: "var(--warm-900)",
                fontWeight: 400,
              }}
            >
              {vet.name}
            </h3>
            <div className="flex shrink-0 items-center gap-1.5">
              {vet.isEmergency24h && (
                <span
                  className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    background: "var(--terracotta-100)",
                    color: "var(--terracotta-700)",
                    border: "1px solid var(--terracotta-200)",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  24h
                </span>
              )}
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(vet.id, !!vet.isFavorite)}
                  aria-label={
                    vet.isFavorite
                      ? "Quitar de favoritos"
                      : "Guardar en favoritos"
                  }
                  className="flex h-7 w-7 items-center justify-center rounded transition-colors"
                  style={{
                    color: vet.isFavorite
                      ? "var(--terracotta-500)"
                      : "var(--warm-300)",
                  }}
                >
                  <Heart
                    className="h-4 w-4"
                    style={{
                      fill: vet.isFavorite ? "currentColor" : "none",
                    }}
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
          </div>

          <p
            className="flex items-center gap-1 truncate text-sm"
            style={{
              fontFamily: "var(--font-inter)",
              color: "var(--warm-600)",
            }}
          >
            <MapPin
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: "var(--terracotta-400)" }}
              aria-hidden="true"
            />
            {vet.clinicName}
          </p>

          {/* Specialties — border-only tags, not filled pills */}
          <div className="flex flex-wrap gap-1">
            {vet.specialties.slice(0, 3).map((spec) => (
              <span
                key={spec}
                className="rounded px-2 py-0.5 text-xs"
                style={{
                  border: "1px solid var(--forest-200)",
                  color: "var(--forest-700)",
                  fontFamily: "var(--font-inter)",
                }}
              >
                {spec}
              </span>
            ))}
            {vet.specialties.length > 3 && (
              <span
                className="text-xs"
                style={{
                  color: "var(--warm-400)",
                  fontFamily: "var(--font-inter)",
                }}
              >
                +{vet.specialties.length - 3}
              </span>
            )}
          </div>

          {/* Rating */}
          <div
            className="flex items-center gap-1.5"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            {vet.avgRating ? (
              <>
                <StarRating value={vet.avgRating} size="sm" />
                <span className="text-xs" style={{ color: "var(--warm-500)" }}>
                  ({vet.reviewCount})
                </span>
              </>
            ) : (
              <span className="text-xs" style={{ color: "var(--warm-400)" }}>
                Sin reseñas
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex gap-2 px-4 pb-4"
        style={{ marginTop: "auto" }}
      >
        <Link
          href={`/dashboard/vets/${vet.id}`}
          className="flex flex-1 items-center justify-center rounded px-3 py-2 text-sm font-medium transition-colors"
          style={{
            border: "1px solid var(--forest-900)",
            color: "var(--forest-900)",
            fontFamily: "var(--font-inter)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background =
              "var(--forest-50)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background =
              "transparent";
          }}
        >
          Ver perfil
        </Link>
        {onSchedule && (
          <button
            type="button"
            onClick={() => onSchedule(vet.id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-2 text-sm font-medium transition-colors"
            style={{
              background: "var(--forest-900)",
              color: "var(--cream-25)",
              fontFamily: "var(--font-inter)",
            }}
          >
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            Agendar
          </button>
        )}
      </div>
    </article>
  );
}
