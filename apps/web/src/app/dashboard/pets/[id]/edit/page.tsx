"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { PetForm, type CreatePetInput } from "@/components/pets/pet-form";
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
      <div className="space-y-8">
        <div className="skeleton-warm" style={{ height: "24px", width: "160px" }} />
        <div className="skeleton-warm" style={{ height: "36px", width: "240px" }} />
        <div className="skeleton-warm" style={{ height: "400px" }} />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p
          className="text-xl italic"
          style={{ fontFamily: "var(--font-fraunces)", color: "var(--warm-600)" }}
        >
          Mascota no encontrada
        </p>
        <Link
          href="/dashboard/pets"
          className="flex items-center gap-1 text-sm hover:underline"
          style={{ fontFamily: "var(--font-inter)", color: "var(--forest-700)" }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a mis mascotas
        </Link>
      </div>
    );
  }

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
    <div className="space-y-8">
      <Link
        href={`/dashboard/pets/${id}`}
        className="flex items-center gap-1 text-sm transition-colors hover:underline"
        style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver al perfil
      </Link>

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
