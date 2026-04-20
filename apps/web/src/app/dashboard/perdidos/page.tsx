"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PawPrint, Plus, Filter, MapPin, Calendar } from "lucide-react";

interface LostReport {
  id: string;
  petName: string;
  species: string;
  breed: string | null;
  photoUrl: string | null;
  lostAt: string;
  approximateZone: string;
  status: "active" | "found";
  contactPreference: string;
  description: string | null;
  userId: string;
  userName: string;
}

interface LostReportsResponse {
  items: LostReport[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const SPECIES_OPTIONS = ["Perro", "Gato", "Ave", "Conejo", "Otro"];
const RADIUS_OPTIONS = [
  { label: "100m", value: 0.1 },
  { label: "1km", value: 1 },
  { label: "5km", value: 5 },
  { label: "10km", value: 10 },
];

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ReportSkeleton() {
  return (
    <div
      className="skeleton-warm rounded-xl"
      style={{ height: "220px" }}
      aria-hidden="true"
    />
  );
}

function ReportCard({ report }: { report: LostReport }) {
  const initials = report.petName.charAt(0).toUpperCase();

  return (
    <article
      className="card-editorial group flex flex-col overflow-hidden transition-all"
      style={{ borderRadius: "12px" }}
    >
      {/* Photo */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ height: "160px", background: "var(--cream-100)" }}
      >
        {report.photoUrl ? (
          <img
            src={report.photoUrl}
            alt={`Foto de ${report.petName}`}
            width={400}
            height={160}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: "var(--forest-50)" }}
          >
            <span
              className="text-5xl"
              style={{
                fontFamily: "var(--font-fraunces)",
                fontStyle: "italic",
                color: "var(--forest-400)",
                fontWeight: 300,
              }}
            >
              {initials}
            </span>
          </div>
        )}
        {/* Status badge */}
        <span
          className="absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={
            report.status === "found"
              ? {
                  background: "var(--forest-100)",
                  color: "var(--forest-700)",
                  border: "1px solid var(--forest-200)",
                }
              : {
                  background: "var(--terracotta-100)",
                  color: "var(--terracotta-700)",
                  border: "1px solid var(--terracotta-200)",
                }
          }
        >
          {report.status === "found" ? "Encontrado" : "Activo"}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3
            className="text-lg leading-snug"
            style={{
              fontFamily: "var(--font-fraunces)",
              fontStyle: "italic",
              color: "var(--warm-900)",
              fontWeight: 400,
            }}
          >
            {report.petName}
          </h3>
          <p
            className="text-sm"
            style={{
              fontFamily: "var(--font-inter)",
              color: "var(--warm-600)",
            }}
          >
            {report.species}
            {report.breed ? ` · ${report.breed}` : ""}
          </p>
        </div>

        <div className="space-y-1.5">
          <p
            className="flex items-center gap-1.5 text-sm"
            style={{
              fontFamily: "var(--font-inter)",
              color: "var(--warm-700)",
            }}
          >
            <MapPin
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: "var(--terracotta-500)" }}
              aria-hidden="true"
            />
            <span className="truncate">{report.approximateZone}</span>
          </p>
          <p
            className="flex items-center gap-1.5 text-sm"
            style={{
              fontFamily: "var(--font-inter)",
              color: "var(--warm-600)",
            }}
          >
            <Calendar
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: "var(--warm-400)" }}
              aria-hidden="true"
            />
            {formatDateShort(report.lostAt)}
          </p>
        </div>

        <Link
          href={`/dashboard/perdidos/${report.id}`}
          className="mt-auto inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{
            background: "var(--forest-900)",
            color: "var(--cream-25)",
            fontFamily: "var(--font-inter)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background =
              "var(--forest-700)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background =
              "var(--forest-900)";
          }}
        >
          Ver detalle
        </Link>
      </div>
    </article>
  );
}

export default function PerdidosPage() {
  const [reports, setReports] = useState<LostReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [speciesFilter, setSpeciesFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "found">(
    "active",
  );
  const [radiusFilter, setRadiusFilter] = useState<number | "">("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<LostReportsResponse>("/api/lost-reports");
      setReports(data.items ?? []);
    } catch {
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (speciesFilter && r.species !== speciesFilter) return false;
      return true;
    });
  }, [reports, speciesFilter, statusFilter]);

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
            Animales perdidos
          </h1>
          <p
            className="mt-1 text-sm"
            style={{
              fontFamily: "var(--font-inter)",
              color: "var(--warm-600)",
            }}
          >
            Reportes activos de mascotas perdidas en tu zona
          </p>
        </div>
        <Link
          href="/dashboard/perdidos/nuevo"
          className="flex shrink-0 items-center gap-1.5 rounded px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{
            background: "var(--terracotta-500)",
            color: "#fff",
            fontFamily: "var(--font-inter)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background =
              "var(--terracotta-600)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background =
              "var(--terracotta-500)";
          }}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Reportar perdida
        </Link>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl p-4"
        style={{
          background: "var(--cream-25)",
          border: "1px solid var(--border)",
        }}
      >
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
        >
          <span
            className="flex items-center gap-2 text-sm font-medium"
            style={{
              fontFamily: "var(--font-inter)",
              color: "var(--warm-700)",
            }}
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
            Filtros
            {(speciesFilter || statusFilter !== "active" || radiusFilter) && (
              <span
                className="rounded-full px-1.5 py-0.5 text-xs"
                style={{
                  background: "var(--terracotta-100)",
                  color: "var(--terracotta-700)",
                }}
              >
                Activos
              </span>
            )}
          </span>
          <span
            className="text-xs"
            style={{ color: "var(--warm-400)" }}
            aria-hidden="true"
          >
            {showFilters ? "▲" : "▼"}
          </span>
        </button>

        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-4">
            {/* Especie */}
            <div className="flex flex-col gap-1">
              <label
                className="label-editorial"
                htmlFor="filter-species"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Especie
              </label>
              <select
                id="filter-species"
                value={speciesFilter}
                onChange={(e) => setSpeciesFilter(e.target.value)}
                className="flex h-9 rounded border px-2.5 text-sm"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface)",
                  color: "var(--warm-900)",
                  fontFamily: "var(--font-inter)",
                  minWidth: "140px",
                }}
              >
                <option value="">Todas</option>
                {SPECIES_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado */}
            <div className="flex flex-col gap-1">
              <label
                className="label-editorial"
                htmlFor="filter-status"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Estado
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "" | "active" | "found")
                }
                className="flex h-9 rounded border px-2.5 text-sm"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface)",
                  color: "var(--warm-900)",
                  fontFamily: "var(--font-inter)",
                  minWidth: "140px",
                }}
              >
                <option value="">Todos</option>
                <option value="active">Activos</option>
                <option value="found">Encontrados</option>
              </select>
            </div>

            {/* Radio */}
            <div className="flex flex-col gap-1">
              <label
                className="label-editorial"
                htmlFor="filter-radius"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Radio geográfico
              </label>
              <select
                id="filter-radius"
                value={radiusFilter}
                onChange={(e) =>
                  setRadiusFilter(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className="flex h-9 rounded border px-2.5 text-sm"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface)",
                  color: "var(--warm-900)",
                  fontFamily: "var(--font-inter)",
                  minWidth: "140px",
                }}
              >
                <option value="">Todos</option>
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear */}
            {(speciesFilter || statusFilter || radiusFilter !== "") && (
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setSpeciesFilter("");
                    setStatusFilter("active");
                    setRadiusFilter("");
                  }}
                  className="h-9 rounded px-3 text-sm transition-colors"
                  style={{
                    border: "1px solid var(--border)",
                    color: "var(--warm-600)",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  Limpiar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ReportSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="flex flex-col items-center gap-4 py-16 text-center"
          role="status"
          aria-live="polite"
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
            No hay reportes activos en tu zona
          </p>
          <p
            className="text-sm"
            style={{
              fontFamily: "var(--font-inter)",
              color: "var(--warm-400)",
            }}
          >
            Podés ser el primero en reportar un animal perdido
          </p>
          <Link
            href="/dashboard/perdidos/nuevo"
            className="rounded px-4 py-2 text-sm font-medium"
            style={{
              background: "var(--forest-900)",
              color: "var(--cream-25)",
              fontFamily: "var(--font-inter)",
            }}
          >
            Crear reporte
          </Link>
        </div>
      ) : (
        <>
          <p
            className="text-sm"
            style={{
              fontFamily: "var(--font-inter)",
              color: "var(--warm-400)",
            }}
            aria-live="polite"
          >
            {filtered.length} reporte{filtered.length !== 1 ? "s" : ""}{" "}
            encontrado{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
