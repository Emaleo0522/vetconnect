"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { PetForm } from "@/components/pets/pet-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { CreatePetInput } from "@vetconnect/shared/validators/pets";

export default function NewPetPage() {
  const router = useRouter();

  async function handleCreate(data: CreatePetInput) {
    await api.post("/api/pets", data);
    router.push("/dashboard/pets");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/pets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver a mascotas</span>
          </Button>
        </Link>
        <h1 className="font-heading text-2xl font-bold">Agregar mascota</h1>
      </div>

      <PetForm onSubmit={handleCreate} />
    </div>
  );
}
