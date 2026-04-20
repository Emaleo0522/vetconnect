"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { PetForm, type CreatePetInput } from "@/components/pets/pet-form";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function NewPetPage() {
  const router = useRouter();

  async function handleCreate(data: CreatePetInput) {
    await api.post("/api/pets", data);
    toast.success("Mascota registrada correctamente");
    router.push("/dashboard/pets");
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/pets"
          className="flex items-center gap-1 text-sm transition-colors hover:underline"
          style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Mis mascotas
        </Link>
      </div>

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
          Agregar mascota
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}
        >
          Completa los datos de tu compañero para comenzar su historial medico.
        </p>
      </div>

      <PetForm onSubmit={handleCreate} />
    </div>
  );
}
