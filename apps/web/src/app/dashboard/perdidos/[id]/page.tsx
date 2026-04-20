"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Phone,
  MessageCircle,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  PawPrint,
} from "lucide-react";
import dynamic from "next/dynamic";

const LostReportMap = dynamic(
  () =>
    import("@/components/perdidos/lost-report-map").then((m) => ({
      default: m.LostReportMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{
          height: "280px",
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

interface LostReportDetail {
  id: string;
  petName: string;
  species: string;
  breed: string | null;
  photoUrl: string | null;
  lostAt: string;
  approximateZone: string | null;
  latitude: string | null;
  longitude: string | null;
  status: "active" | "found";
  contactPreference: string;
  contactValue: string;
  description: string | null;
  userId: string;
  userName: string;
  createdAt: string;
}

interface Sighting {
  id: string;
  userId: string;
  userName: string;
  description: string;
  zone: string;
  createdAt: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

export default function LostReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;
  const user = useAuthStore((s) => s.user);

  const [report, setReport] = useState<LostReportDetail | null>(null);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [relatedReports, setRelatedReports] = useState<LostReportDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingFound, setIsMarkingFound] = useState(false);
  const [markFoundError, setMarkFoundError] = useState<string | null>(null);

  // Sighting form
  const [sightingDesc, setSightingDesc] = useState("");
  const [sightingZone, setSightingZone] = useState("");
  const [submittingSighting, setSubmittingSighting] = useState(false);
  const [sightingError, setSightingError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reportData, sightingsData, relatedData] = await Promise.allSettled([
        api.get<LostReportDetail>(`/api/lost-reports/${reportId}`),
        api.get<{ items: Sighting[] }>(`/api/lost-reports/${reportId}/sightings`),
        api.get<{ items: LostReportDetail[] }>("/api/lost-reports?limit=3&status=active"),
      ]);

      if (reportData.status === "fulfilled") setReport(reportData.value);
      if (sightingsData.status === "fulfilled")
        setSightings(sightingsData.value.items ?? []);
      if (relatedData.status === "fulfilled") {
        const items = relatedData.value.items ?? [];
        setRelatedReports(items.filter((r) => r.id !== reportId).slice(0, 3));
      }
    } catch {
      // handled
    } finally {
      setIsLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  async function handleMarkFound() {
    if (!report) return;
    setIsMarkingFound(true);
    setMarkFoundError(null);
    try {
      await api.patch(`/api/lost-reports/${reportId}`, { status: "found" });
      setReport((prev) => (prev ? { ...prev, status: "found" } : prev));
    } catch (err) {
      if (err instanceof ApiError) {
        setMarkFoundError(err.message);
      } else {
        setMarkFoundError("Error al actualizar el estado");
      }
    } finally {
      setIsMarkingFound(false);
    }
  }

  async function handleSightingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sightingDesc.trim() || !sightingZone.trim()) return;
    setSubmittingSighting(true);
    setSightingError(null);
    try {
      await api.post(`/api/lost-reports/${reportId}/sightings`, {
        description: sightingDesc.trim(),
        zone: sightingZone.trim(),
      });
      setSightingDesc("");
      setSightingZone("");
      // Reload sightings
      const data = await api.get<{ items: Sighting[] }>(
        `/api/lost-reports/${reportId}/sightings`,
      );
      setSightings(data.items ?? []);
    } catch (err) {
      if (err instanceof ApiError) {
        setSightingError(err.message);
      } else {
        setSightingError("Error al enviar el avistamiento");
      }
    } finally {
      setSubmittingSighting(false);
    }
  }

  const inputStyle = {
    background: "var(--surface)",
    borderColor: "var(--border)",
    color: "var(--warm-900)",
    fontFamily: "var(--font-inter)",
    fontSize: "16px",
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div
          className="skeleton-warm"
          style={{ height: "24px", width: "160px", borderRadius: "6px" }}
        />
        <div
          className="skeleton-warm"
          style={{ height: "320px", borderRadius: "12px" }}
        />
        <div
          className="skeleton-warm"
          style={{ height: "200px", borderRadius: "12px" }}
        />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/perdidos"
          className="inline-flex items-center gap-1.5 text-sm hover:underline"
          style={{ fontFamily: "var(--font-inter)", color: "var(--forest-700)" }}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a reportes
        </Link>
        <div
          className="flex flex-col items-center gap-4 py-16 text-center"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "12px",
            background: "var(--cream-25)",
          }}
        >
          <PawPrint
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
            Reporte no encontrado
          </p>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded px-4 py-2 text-sm"
            style={{
              border: "1px solid var(--border)",
              color: "var(--warm-700)",
              fontFamily: "var(--font-inter)",
            }}
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === report.userId;
  const hasCoords =
    report.latitude &&
    report.longitude &&
    !isNaN(Number(report.latitude)) &&
    !isNaN(Number(report.longitude));

  const whatsappUrl =
    report.contactPreference === "whatsapp" || report.contactPreference === "phone"
      ? `https://wa.me/${report.contactValue.replace(/[^0-9]/g, "")}`
      : null;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/perdidos"
        className="inline-flex items-center gap-1.5 text-sm hover:underline focus-visible:outline-none"
        style={{ fontFamily: "var(--font-inter)", color: "var(--forest-700)" }}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a reportes
      </Link>

      {/* Status banner if found */}
      {report.status === "found" && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: "var(--forest-50)",
            border: "1px solid var(--forest-200)",
          }}
          role="status"
        >
          <CheckCircle
            className="h-5 w-5 shrink-0"
            style={{ color: "var(--forest-600)" }}
            aria-hidden="true"
          />
          <p
            className="text-sm font-medium"
            style={{
              fontFamily: "var(--font-inter)",
              color: "var(--forest-700)",
            }}
          >
            ¡Esta mascota fue encontrada! Gracias a la comunidad.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left — main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Hero */}
          <article
            className="overflow-hidden rounded-xl"
            style={{ border: "1px solid var(--border)" }}
          >
            {report.photoUrl && (
              <div
                className="overflow-hidden"
                style={{ maxHeight: "340px" }}
              >
                <img
                  src={report.photoUrl}
                  alt={`Foto de ${report.petName}`}
                  width={800}
                  height={340}
                  className="h-full w-full object-cover"
                  style={{ maxHeight: "340px" }}
                />
              </div>
            )}

            <div
              className="space-y-4 p-6"
              style={{ background: "var(--cream-25)" }}
            >
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
                    {report.petName}
                  </h1>
                  <p
                    className="mt-0.5 text-sm"
                    style={{
                      fontFamily: "var(--font-inter)",
                      color: "var(--warm-600)",
                    }}
                  >
                    {report.species}
                    {report.breed ? ` · ${report.breed}` : ""}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-3 py-1 text-sm font-medium"
                  style={
                    report.status === "found"
                      ? {
                          background: "var(--forest-100)",
                          color: "var(--forest-700)",
                          border: "1px solid var(--forest-200)",
                          fontFamily: "var(--font-inter)",
                        }
                      : {
                          background: "var(--terracotta-100)",
                          color: "var(--terracotta-700)",
                          border: "1px solid var(--terracotta-200)",
                          fontFamily: "var(--font-inter)",
                        }
                  }
                >
                  {report.status === "found" ? "Encontrado" : "Perdido"}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <p
                  className="flex items-center gap-2 text-sm"
                  style={{
                    fontFamily: "var(--font-inter)",
                    color: "var(--warm-700)",
                  }}
                >
                  <Calendar
                    className="h-4 w-4 shrink-0"
                    style={{ color: "var(--warm-400)" }}
                    aria-hidden="true"
                  />
                  Perdido el {formatDate(report.lostAt)}
                </p>
                {report.approximateZone && (
                  <p
                    className="flex items-center gap-2 text-sm"
                    style={{
                      fontFamily: "var(--font-inter)",
                      color: "var(--warm-700)",
                    }}
                  >
                    <MapPin
                      className="h-4 w-4 shrink-0"
                      style={{ color: "var(--terracotta-500)" }}
                      aria-hidden="true"
                    />
                    {report.approximateZone}
                  </p>
                )}
              </div>

              {report.description && (
                <div
                  className="rounded-lg p-4"
                  style={{
                    background: "var(--cream-100)",
                    border: "1px solid var(--cream-200)",
                  }}
                >
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      fontFamily: "var(--font-inter)",
                      color: "var(--warm-800)",
                    }}
                  >
                    {report.description}
                  </p>
                </div>
              )}

              {/* Reportado por */}
              <p
                className="text-xs"
                style={{
                  fontFamily: "var(--font-inter)",
                  color: "var(--warm-400)",
                }}
              >
                Reportado por <strong style={{ color: "var(--warm-600)" }}>{report.userName}</strong>{" "}
                el {formatDateShort(report.createdAt)}
              </p>
            </div>
          </article>

          {/* Sightings */}
          <section
            className="rounded-xl p-5"
            style={{
              border: "1px solid var(--border)",
              background: "var(--cream-25)",
            }}
          >
            <h2
              className="mb-4 text-lg"
              style={{
                fontFamily: "var(--font-fraunces)",
                fontStyle: "italic",
                color: "var(--warm-900)",
                fontWeight: 400,
              }}
            >
              Avistamientos reportados
            </h2>

            {sightings.length === 0 ? (
              <p
                className="py-4 text-center text-sm"
                style={{
                  fontFamily: "var(--font-inter)",
                  color: "var(--warm-400)",
                }}
              >
                Aún no hay avistamientos. Si ves esta mascota, reportalo abajo.
              </p>
            ) : (
              <div className="space-y-3">
                {sightings.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg p-3"
                    style={{
                      background: "var(--cream-50)",
                      border: "1px solid var(--cream-200)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className="text-sm font-medium"
                        style={{
                          fontFamily: "var(--font-inter)",
                          color: "var(--warm-900)",
                        }}
                      >
                        {s.description}
                      </p>
                      <span
                        className="shrink-0 text-xs"
                        style={{ color: "var(--warm-400)" }}
                      >
                        {formatDateShort(s.createdAt)}
                      </span>
                    </div>
                    <p
                      className="mt-1 flex items-center gap-1 text-xs"
                      style={{ color: "var(--warm-600)" }}
                    >
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {s.zone} · por {s.userName}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Report sighting form — only for non-owners */}
            {!isOwner && report.status === "active" && (
              <form
                onSubmit={handleSightingSubmit}
                className="mt-5 space-y-3 border-t pt-4"
                style={{ borderColor: "var(--border)" }}
              >
                <p
                  className="text-sm font-medium"
                  style={{
                    fontFamily: "var(--font-inter)",
                    color: "var(--warm-700)",
                  }}
                >
                  Vi a esta mascota
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <textarea
                    value={sightingDesc}
                    onChange={(e) => setSightingDesc(e.target.value)}
                    placeholder="Descripción de lo que viste"
                    rows={2}
                    required
                    className="flex w-full resize-none rounded border px-3 py-2 text-sm"
                    style={inputStyle}
                    aria-label="Descripción del avistamiento"
                  />
                  <input
                    type="text"
                    value={sightingZone}
                    onChange={(e) => setSightingZone(e.target.value)}
                    placeholder="Zona donde la viste"
                    required
                    className="flex h-10 w-full rounded border px-3 text-sm"
                    style={inputStyle}
                    aria-label="Zona del avistamiento"
                  />
                </div>
                {sightingError && (
                  <p
                    className="text-sm"
                    style={{
                      color: "var(--terracotta-700)",
                      fontFamily: "var(--font-inter)",
                    }}
                    role="alert"
                  >
                    {sightingError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={
                    submittingSighting ||
                    !sightingDesc.trim() ||
                    !sightingZone.trim()
                  }
                  className="flex items-center gap-2 rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
                  style={{
                    background: "var(--forest-900)",
                    color: "var(--cream-25)",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  {submittingSighting && (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  )}
                  Enviar avistamiento
                </button>
              </form>
            )}
          </section>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Map */}
          {hasCoords && (
            <div
              className="overflow-hidden rounded-xl"
              style={{ border: "1px solid var(--border)" }}
            >
              <div
                className="px-4 py-3"
                style={{ borderBottom: "1px solid var(--border)", background: "var(--cream-25)" }}
              >
                <h3
                  className="text-sm font-medium"
                  style={{
                    fontFamily: "var(--font-inter)",
                    color: "var(--warm-700)",
                  }}
                >
                  Zona aproximada
                </h3>
                <p
                  className="text-xs"
                  style={{ color: "var(--warm-400)", fontFamily: "var(--font-inter)" }}
                >
                  El círculo muestra el área donde fue vista por última vez
                </p>
              </div>
              <LostReportMap
                lat={Number(report.latitude)}
                lng={Number(report.longitude)}
                label={report.petName}
              />
            </div>
          )}

          {/* Contact */}
          <div
            className="rounded-xl p-5 space-y-4"
            style={{
              border: "1px solid var(--border)",
              background: "var(--cream-25)",
            }}
          >
            <h3
              className="text-base"
              style={{
                fontFamily: "var(--font-fraunces)",
                fontStyle: "italic",
                color: "var(--warm-900)",
                fontWeight: 400,
              }}
            >
              Contactar al dueño
            </h3>

            <div className="flex flex-col gap-2">
              {(report.contactPreference === "whatsapp" ||
                report.contactPreference === "phone") &&
                whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded px-4 py-2.5 text-sm font-medium"
                    style={{
                      background: "var(--forest-900)",
                      color: "var(--cream-25)",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    WhatsApp
                  </a>
                )}
              {report.contactPreference === "phone" && (
                <a
                  href={`tel:${report.contactValue}`}
                  className="flex items-center gap-2 rounded px-4 py-2.5 text-sm font-medium"
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
              {report.contactPreference === "email" && (
                <a
                  href={`mailto:${report.contactValue}`}
                  className="flex items-center gap-2 rounded px-4 py-2.5 text-sm font-medium"
                  style={{
                    background: "var(--forest-900)",
                    color: "var(--cream-25)",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Enviar email
                </a>
              )}
            </div>
          </div>

          {/* Mark found — owner only */}
          {isOwner && report.status === "active" && (
            <div
              className="rounded-xl p-5 space-y-3"
              style={{
                border: "1px solid var(--forest-200)",
                background: "var(--forest-50)",
              }}
            >
              <h3
                className="text-sm font-medium"
                style={{
                  fontFamily: "var(--font-inter)",
                  color: "var(--forest-700)",
                }}
              >
                ¿La encontraste?
              </h3>
              <p
                className="text-xs"
                style={{
                  color: "var(--forest-600)",
                  fontFamily: "var(--font-inter)",
                }}
              >
                Marcá el reporte como resuelto para que la comunidad lo sepa
              </p>
              {markFoundError && (
                <p
                  className="text-sm"
                  style={{ color: "var(--terracotta-700)", fontFamily: "var(--font-inter)" }}
                  role="alert"
                >
                  {markFoundError}
                </p>
              )}
              <button
                type="button"
                onClick={handleMarkFound}
                disabled={isMarkingFound}
                className="flex w-full items-center justify-center gap-2 rounded px-4 py-2.5 text-sm font-medium disabled:opacity-50"
                style={{
                  background: "var(--forest-900)",
                  color: "var(--cream-25)",
                  fontFamily: "var(--font-inter)",
                }}
              >
                {isMarkingFound ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCircle className="h-4 w-4" aria-hidden="true" />
                )}
                Marcar como encontrada
              </button>
            </div>
          )}

          {/* Related reports */}
          {relatedReports.length > 0 && (
            <div
              className="rounded-xl p-5 space-y-3"
              style={{
                border: "1px solid var(--border)",
                background: "var(--cream-25)",
              }}
            >
              <h3
                className="text-sm font-medium"
                style={{
                  fontFamily: "var(--font-inter)",
                  color: "var(--warm-700)",
                }}
              >
                Otros reportes activos
              </h3>
              <div className="space-y-2">
                {relatedReports.map((r) => (
                  <Link
                    key={r.id}
                    href={`/dashboard/perdidos/${r.id}`}
                    className="flex items-center gap-3 rounded-lg p-2.5 transition-colors"
                    style={{
                      border: "1px solid var(--cream-200)",
                      background: "var(--surface)",
                    }}
                  >
                    {r.photoUrl ? (
                      <img
                        src={r.photoUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="rounded-md object-cover shrink-0"
                        style={{ width: "40px", height: "40px" }}
                        aria-hidden="true"
                      />
                    ) : (
                      <div
                        className="flex shrink-0 items-center justify-center rounded-md"
                        style={{
                          width: "40px",
                          height: "40px",
                          background: "var(--forest-50)",
                        }}
                        aria-hidden="true"
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-fraunces)",
                            fontStyle: "italic",
                            color: "var(--forest-400)",
                            fontSize: "18px",
                          }}
                        >
                          {r.petName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p
                        className="truncate text-sm font-medium"
                        style={{
                          fontFamily: "var(--font-inter)",
                          color: "var(--warm-900)",
                        }}
                      >
                        {r.petName}
                      </p>
                      <p
                        className="truncate text-xs"
                        style={{ color: "var(--warm-500)" }}
                      >
                        {r.species} · {r.approximateZone ?? "Zona desconocida"}
                      </p>
                    </div>
                    <AlertCircle
                      className="ml-auto h-4 w-4 shrink-0"
                      style={{ color: "var(--terracotta-400)" }}
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
