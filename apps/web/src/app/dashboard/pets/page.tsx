"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PetCard } from "@/components/pets/pet-card";
import { PawPrint, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PetData {
  id: string;
  name: string;
  photo: string | null;
  species: string;
  breed: string | null;
  birthDate: string | null;
  weight: string | null;
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
        // Error handled by api.ts (401 redirect)
      } finally {
        setLoading(false);
      }
    }
    fetchPets();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Mis mascotas</h1>
          <p className="text-muted-foreground">
            Gestiona tus mascotas registradas
          </p>
        </div>
        <Link
          href="/dashboard/pets/new"
          className={cn(buttonVariants(), "gap-2")}
        >
          <Plus className="h-4 w-4" />
          Agregar mascota
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      ) : pets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <PawPrint className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium">No tenes mascotas registradas</p>
              <p className="text-sm text-muted-foreground">
                Registra tu primera mascota para comenzar a usar VetConnect.
              </p>
            </div>
            <Link
              href="/dashboard/pets/new"
              className={cn(buttonVariants(), "gap-2")}
            >
              <Plus className="h-4 w-4" />
              Agregar mascota
            </Link>
          </CardContent>
        </Card>
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
