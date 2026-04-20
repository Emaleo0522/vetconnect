"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PetCard } from "@/components/pets/pet-card";
import { Plus } from "lucide-react";

interface PetData {
  id: string;
  name: string;
  photo: string | null;
  species: string;
  breed: string | null;
  birthDate: string | null;
  weight: string | null;
}

function PetGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-warm" style={{ height: "120px" }} />
      ))}
    </div>
  );
}

export default function PetsPage() {
  const [pets, setPets] = useState<PetData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPets() {
      try {
        const data = await api.get<{ items: PetData[] }>("/api/pets");
        setPets(data.items);
      } catch {
        // api.ts maneja 401 redirect
      } finally {
        setLoading(false);
      }
    }
    fetchPets();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page header editorial */}
      <div className="flex items-end justify-between border-b pb-5" style={{ borderColor: "var(--border)" }}>
        <div>
          <h1
            className="text-3xl"
            style={{
              fontFamily: "var(--font-fraunces)",
              fontStyle: "italic",
              color: "var(--warm-900)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
            }}
          >
            Mis mascotas
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}
          >
            Historial y cartilla sanitaria de tus animales
          </p>
        </div>
        <Link
          href="/dashboard/pets/new"
          className="flex items-center gap-1.5 rounded px-4 py-2.5 text-sm font-medium transition-colors"
          style={{
            background: "var(--forest-900)",
            color: "var(--cream-25)",
            fontFamily: "var(--font-inter)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "var(--forest-700)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "var(--forest-900)";
          }}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Agregar mascota
        </Link>
      </div>

      {loading ? (
        <PetGridSkeleton />
      ) : pets.length === 0 ? (
        /* Empty state editorial */
        <div className="flex flex-col items-center py-20 text-center">
          <p
            className="text-2xl"
            style={{
              fontFamily: "var(--font-fraunces)",
              fontStyle: "italic",
              color: "var(--warm-600)",
              fontWeight: 300,
            }}
          >
            Aun no agregaste mascotas
          </p>
          <p
            className="mt-2 max-w-sm text-sm leading-relaxed"
            style={{ fontFamily: "var(--font-inter)", color: "var(--warm-400)" }}
          >
            Registra tu primera mascota para comenzar a gestionar su historial medico y cartilla sanitaria.
          </p>
          <Link
            href="/dashboard/pets/new"
            className="mt-6 flex items-center gap-1.5 rounded px-5 py-2.5 text-sm font-medium transition-colors"
            style={{
              background: "var(--forest-900)",
              color: "var(--cream-25)",
              fontFamily: "var(--font-inter)",
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agregar mascota
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet) => (
            <PetCard key={pet.id} {...pet} />
          ))}
        </div>
      )}
    </div>
  );
}
