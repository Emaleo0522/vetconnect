"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VetCard, type VetListItem } from "@/components/vets/vet-card";
import { Search, Stethoscope, List, Map as MapIcon } from "lucide-react";
import dynamic from "next/dynamic";

const VetMap = dynamic(
  () => import("@/components/vets/vet-map").then((m) => ({ default: m.VetMap })),
  { ssr: false, loading: () => <div className="flex h-[400px] items-center justify-center rounded-lg border border-border bg-muted/30"><p className="text-sm text-muted-foreground">Cargando mapa...</p></div> },
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

export default function VetsPage() {
  const [vets, setVets] = useState<VetListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [emergency24h, setEmergency24h] = useState(false);

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

  useEffect(() => {
    fetchVets();
  }, [fetchVets]);

  // Collect unique specialties from loaded vets
  const allSpecialties = useMemo(() => {
    const set = new Set<string>();
    for (const vet of vets) {
      for (const s of vet.specialties) {
        set.add(s);
      }
    }
    return Array.from(set).sort();
  }, [vets]);

  // Filter vets
  const filtered = useMemo(() => {
    return vets.filter((vet) => {
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
  }, [vets, search, specialtyFilter, emergency24h]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold">
          Directorio Veterinario
        </h1>
        <p className="text-muted-foreground">
          Encuentra al mejor profesional para tu mascota
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="vet-search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="vet-search"
                  placeholder="Nombre, clinica o especialidad..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="w-full space-y-1.5 sm:w-48">
              <Label htmlFor="vet-specialty">Especialidad</Label>
              <select
                id="vet-specialty"
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Todas</option>
                {allSpecialties.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-1.5 text-sm transition-colors hover:bg-muted">
              <input
                type="checkbox"
                checked={emergency24h}
                onChange={(e) => setEmergency24h(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              Guardia 24h
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: List / Map */}
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">
            <List className="mr-1.5 h-4 w-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="map">
            <MapIcon className="mr-1.5 h-4 w-4" />
            Mapa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex gap-4 animate-pulse">
                      <div className="h-16 w-16 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-muted" />
                        <div className="h-3 w-1/2 rounded bg-muted" />
                        <div className="h-3 w-2/3 rounded bg-muted" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <Stethoscope className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  {vets.length === 0
                    ? "No hay veterinarios registrados"
                    : "No se encontraron veterinarios con esos filtros"}
                </p>
                {(search || specialtyFilter || emergency24h) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setSpecialtyFilter("");
                      setEmergency24h(false);
                    }}
                  >
                    Limpiar filtros
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((vet) => (
                <VetCard key={vet.id} vet={vet} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="map" className="mt-4">
          <Card>
            <CardContent className="p-0 overflow-hidden rounded-lg">
              <VetMap vets={filtered} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
