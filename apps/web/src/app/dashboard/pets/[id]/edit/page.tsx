"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { PetForm, type CreatePetInput } from "@/components/pets/pet-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface PetDetail {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birthDate: string | null;
  sex: string;
  color: string | null;
  weight: string | null;
  microchip: string | null;
  allergies: string | null;
  medicalConditions: string | null;
  currentMedication: string | null;
}

export default function EditPetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [pet, setPet] = useState<PetDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPet() {
      try {
        const data = await api.get<PetDetail>(`/api/pets/${id}`);
        setPet(data);
      } catch {
        toast.error("No se pudo cargar la mascota");
      } finally {
        setLoading(false);
      }
    }
    fetchPet();
  }, [id]);

  async function handleUpdate(data: CreatePetInput) {
    await api.put(`/api/pets/${id}`, data);
    toast.success("Mascota actualizada");
    router.push(`/dashboard/pets/${id}`);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-muted-foreground">Mascota no encontrada.</p>
        <Link href="/dashboard/pets">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver a mascotas
          </Button>
        </Link>
      </div>
    );
  }

  // Convert pet data to form defaults
  const defaults: Partial<CreatePetInput> = {
    name: pet.name,
    species: pet.species as CreatePetInput["species"],
    breed: pet.breed ?? "",
    birthDate: pet.birthDate ? pet.birthDate.split("T")[0] : "",
    sex: pet.sex as CreatePetInput["sex"],
    color: pet.color ?? "",
    weight: pet.weight ? parseFloat(pet.weight) : undefined,
    microchip: pet.microchip ?? "",
    allergies: pet.allergies ?? "",
    medicalConditions: pet.medicalConditions ?? "",
    currentMedication: pet.currentMedication ?? "",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/pets/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver al perfil</span>
          </Button>
        </Link>
        <h1 className="font-heading text-2xl font-bold">
          Editar a {pet.name}
        </h1>
      </div>

      <PetForm
        defaultValues={defaults}
        onSubmit={handleUpdate}
        submitLabel="Guardar cambios"
        isEdit
      />
    </div>
  );
}
