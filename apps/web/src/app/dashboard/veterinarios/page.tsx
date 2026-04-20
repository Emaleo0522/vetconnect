"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { VetCard, type VetListItem } from "@/components/vets/vet-card";
import { Search, Stethoscope, List, Map as MapIcon, Heart } from "lucide-react";
import dynamic from "next/dynamic";

const VetMap = dynamic(
  () =>
    import("@/components/vets/vet-map").then((m) => ({ default: m.VetMap })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{
          height: "400px",
          background: "var(--cream-100)",
          border: "1px solid var(--border)",
        }}
      >
        <p
          className="text-sm"
          style={{
            color: "var(--warm-400)",
            fontFamily: "var(--font-inter)",
          }}
        >
          Cargando mapa...
        </p>
      </div>
    ),
  },
);

interface VetsResponse {
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
}

type ViewMode = "list" | "map";

function VetSkeleton() {
  return (
    <div
      className="skeleton-warm rounded-xl"
      style={{ height: "196px" }}
      aria-hidden="true"
    />
  );
}

export default function VeterinariesPage() {
  const router = useRouter();
  const [vets, setVets] = useState<VetListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchRaw, setSearchRaw] = useState("");
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [emergency24h, setEmergency24h] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchVets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<VetsResponse[]>("/api/vets");
      setVets(data);
    } catch {
      // api.ts handles 401 redirect
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    try {
      const data = await api.get<{ vetIds: string[] }>("/api/users/me/favorites");
      setFavorites(new Set(data.vetIds ?? []));
    } catch {
      // Favorites not critical — silently skip
    }
  }, []);

  useEffect(() => {
    fetchVets();
    fetchFavorites();
  }, [fetchVets, fetchFavorites]);

  // Debounce search — 300ms (rate limit awareness per security-spec)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchRaw);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchRaw]);

  const allSpecialties = useMemo(() => {
    const set = new Set<string>();
    for (const vet of vets) {
      for (const s of vet.specialties) {
        set.add(s);
      }
    }
    return Array.from(set).sort();
  }, [vets]);

  const filtered = useMemo(() => {
    return vets
      .map((vet) => ({ ...vet, isFavorite: favorites.has(vet.id) }))
      .filter((vet) => {
        if (showFavoritesOnly && !vet.isFavorite) return false;
        if (emergency24h && !vet.isEmergency24h) return false;
        if (
          specialtyFilter &&
          !vet.specialties.some((s) =>
            s.toLowerCase().includes(specialtyFilter.toLowerCase()),
          )
        )
          return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            vet.name.toLowerCase().includes(q) ||
            vet.clinicName.toLowerCase().includes(q) ||
            vet.clinicAddress.toLowerCase().includes(q) ||
            vet.specialties.some((s) => s.toLowerCase().includes(q))
          );
        }
        return true;
      });
  }, [vets, search, specialtyFilter, emergency24h, favorites, showFavoritesOnly]);

  async function handleToggleFavorite(vetId: string, isFavorite: boolean) {
    // Optimistic update
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFavorite) {
        next.delete(vetId);
      } else {
        next.add(vetId);
      }
      return next;
    });

    try {
      if (isFavorite) {
        await api.delete(`/api/users/me/favorites/${vetId}`);
      } else {
        await api.post(`/api/users/me/favorites`, { vetId });
      }
    } catch {
      // Revert on error
      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFavorite) {
          next.add(vetId);
        } else {
          next.delete(vetId);
        }
        return next;
      });
    }
  }

  function handleSchedule(vetId: string) {
    router.push(`/dashboard/veterinarios/${vetId}?agendar=1`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
          Directorio veterinario
        </h1>
        <p
          className="mt-1 text-sm"
          style={{
            fontFamily: "var(--font-inter)",
            color: "var(--warm-600)",
          }}
        >
          Encontrá al mejor profesional para tu mascota
        </p>
      </div>

      {/* Search + Filters */}
      <div
        className="space-y-3 rounded-xl p-4"
        style={{
          background: "var(--cream-25)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Search bar — editorial style: border-bottom only */}
        <div className="relative">
          <Search
            className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--warm-400)" }}
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Nombre, clínica o especialidad..."
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
            className="w-full pb-2 pl-6 pr-4 text-sm placeholder-current focus:outline-none"
            style={{
              background: "transparent",
              borderBottom: "1px solid var(--border)",
              color: "var(--warm-900)",
              fontFamily: "var(--font-inter)",
              fontStyle: "italic",
              fontSize: "16px",
            }}
            aria-label="Buscar veterinarios"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Specialty select */}
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="h-8 rounded border px-2.5 text-sm"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface)",
              color: "var(--warm-700)",
              fontFamily: "var(--font-inter)",
            }}
            aria-label="Filtrar por especialidad"
          >
            <option value="">Todas las especialidades</option>
            {allSpecialties.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* 24h toggle */}
          <label
            className="flex cursor-pointer items-center gap-2 rounded px-3 py-1.5 text-sm transition-colors"
            style={{
              border: "1px solid var(--border)",
              background: emergency24h ? "var(--forest-50)" : "transparent",
              color: emergency24h ? "var(--forest-700)" : "var(--warm-600)",
              fontFamily: "var(--font-inter)",
            }}
          >
            <input
              type="checkbox"
              checked={emergency24h}
              onChange={(e) => setEmergency24h(e.target.checked)}
              className="h-3.5 w-3.5 rounded"
              style={{ accentColor: "var(--forest-900)" }}
            />
            Guardia 24h
          </label>

          {/* Favorites toggle */}
          <button
            type="button"
            onClick={() => setShowFavoritesOnly((v) => !v)}
            className="flex items-center gap-2 rounded px-3 py-1.5 text-sm transition-colors"
            style={{
              border: `1px solid ${showFavoritesOnly ? "var(--terracotta-400)" : "var(--border)"}`,
              background: showFavoritesOnly
                ? "var(--terracotta-100)"
                : "transparent",
              color: showFavoritesOnly
                ? "var(--terracotta-700)"
                : "var(--warm-600)",
              fontFamily: "var(--font-inter)",
            }}
            aria-pressed={showFavoritesOnly}
          >
            <Heart
              className="h-3.5 w-3.5"
              style={{
                fill: showFavoritesOnly ? "currentColor" : "none",
              }}
              aria-hidden="true"
            />
            Mis favoritos
          </button>

          {/* View toggle: list / map */}
          <div
            className="ml-auto flex overflow-hidden rounded"
            style={{ border: "1px solid var(--border)" }}
          >
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors"
              style={{
                background:
                  viewMode === "list" ? "var(--forest-900)" : "transparent",
                color:
                  viewMode === "list" ? "var(--cream-25)" : "var(--warm-600)",
                fontFamily: "var(--font-inter)",
              }}
              aria-pressed={viewMode === "list"}
            >
              <List className="h-3.5 w-3.5" aria-hidden="true" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className="flex items-center gap-1.5 border-l px-3 py-1.5 text-sm transition-colors"
              style={{
                borderColor: "var(--border)",
                background:
                  viewMode === "map" ? "var(--forest-900)" : "transparent",
                color:
                  viewMode === "map" ? "var(--cream-25)" : "var(--warm-600)",
                fontFamily: "var(--font-inter)",
              }}
              aria-pressed={viewMode === "map"}
            >
              <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Mapa
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <VetSkeleton key={i} />
          ))}
        </div>
      ) : viewMode === "map" ? (
        <div
          className="overflow-hidden rounded-xl"
          style={{ border: "1px solid var(--border)" }}
        >
          <VetMap vets={filtered} />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="flex flex-col items-center gap-4 py-16 text-center"
          role="status"
          aria-live="polite"
        >
          <Stethoscope
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
            {showFavoritesOnly
              ? "No tenés veterinarios guardados como favoritos"
              : vets.length === 0
                ? "No hay veterinarios registrados"
                : "No se encontraron veterinarios con esos filtros"}
          </p>
          {(search || specialtyFilter || emergency24h || showFavoritesOnly) && (
            <button
              type="button"
              onClick={() => {
                setSearchRaw("");
                setSearch("");
                setSpecialtyFilter("");
                setEmergency24h(false);
                setShowFavoritesOnly(false);
              }}
              className="rounded px-4 py-2 text-sm transition-colors"
              style={{
                border: "1px solid var(--border)",
                color: "var(--warm-700)",
                fontFamily: "var(--font-inter)",
              }}
            >
              Limpiar filtros
            </button>
          )}
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
            {filtered.length} veterinario{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((vet) => (
              <VetCard
                key={vet.id}
                vet={vet}
                onToggleFavorite={handleToggleFavorite}
                onSchedule={handleSchedule}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
