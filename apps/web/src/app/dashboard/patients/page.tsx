"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PawPrint, Search, ArrowRight } from "lucide-react";

interface PatientData {
  id: string;
  name: string;
  photo: string | null;
  species: string;
  breed: string | null;
  birthDate: string | null;
  weight: string | null;
  ownerId: string;
}

const SPECIES_LABELS: Record<string, string> = {
  dog: "Perro",
  cat: "Gato",
  bird: "Ave",
  rabbit: "Conejo",
  other: "Otro",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function PetPhoto({ photo, name }: { photo: string | null; name: string }) {
  if (photo) {
    return (
      <img
        src={`${API_URL}${photo}`}
        alt={name}
        className="h-full w-full object-cover"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return <PawPrint className="h-6 w-6 text-muted-foreground/40" />;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchPatients() {
      try {
        const data = await api.get<{ items: PatientData[] }>("/api/pets/my-patients");
        setPatients(data.items);
      } catch {
        // 403 or network error
      } finally {
        setLoading(false);
      }
    }
    fetchPatients();
  }, []);

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.breed ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (SPECIES_LABELS[p.species] ?? p.species).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold">Mis pacientes</h1>
        <p className="text-sm text-muted-foreground">
          Mascotas que te tienen como veterinario de cabecera
        </p>
      </div>

      {/* Search */}
      {patients.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, raza o especie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : patients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <PawPrint className="h-12 w-12 text-muted-foreground/30" />
            <div className="text-center">
              <p className="font-medium">Todavía no tenés pacientes</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Los dueños de mascotas te vinculan como veterinario de cabecera
                desde el perfil de su mascota.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <Search className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              No se encontraron pacientes con &quot;{search}&quot;
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pet) => (
            <Link
              key={pet.id}
              href={`/dashboard/pets/${pet.id}`}
              className="group block rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                  <PetPhoto photo={pet.photo} name={pet.name} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold leading-tight">{pet.name}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {SPECIES_LABELS[pet.species] ?? pet.species}
                    {pet.breed ? ` · ${pet.breed}` : ""}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {SPECIES_LABELS[pet.species] ?? pet.species}
                    </Badge>
                    {pet.weight && (
                      <Badge variant="outline" className="text-xs">
                        {pet.weight} kg
                      </Badge>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Count */}
      {!loading && patients.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} de {patients.length} paciente{patients.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
