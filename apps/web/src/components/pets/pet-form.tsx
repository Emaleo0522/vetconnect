"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

const speciesOptions = [
  { value: "dog", label: "Perro" },
  { value: "cat", label: "Gato" },
  { value: "bird", label: "Ave" },
  { value: "rabbit", label: "Conejo" },
  { value: "other", label: "Otro" },
];

const sexOptions = [
  { value: "male", label: "Macho" },
  { value: "female", label: "Hembra" },
];

type PetSpecies = "dog" | "cat" | "bird" | "rabbit" | "other";
type PetSex = "male" | "female";

export interface CreatePetInput {
  name: string;
  species: PetSpecies;
  breed?: string;
  birthDate: string;
  sex: PetSex;
  color?: string;
  weight?: number;
  microchip?: string;
  allergies?: string;
  medicalConditions?: string;
  currentMedication?: string;
}

interface PetFormProps {
  defaultValues?: Partial<CreatePetInput>;
  onSubmit: (data: CreatePetInput) => Promise<void>;
  submitLabel?: string;
  isEdit?: boolean;
}

export function PetForm({
  defaultValues,
  onSubmit,
  submitLabel = "Registrar mascota",
  isEdit = false,
}: PetFormProps) {
  const [showMedical, setShowMedical] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreatePetInput>({
    defaultValues: {
      name: "",
      species: "dog",
      breed: "",
      birthDate: "",
      sex: "male",
      color: "",
      weight: undefined,
      microchip: "",
      allergies: "",
      medicalConditions: "",
      currentMedication: "",
      ...defaultValues,
    },
  });

  const selectedSpecies = watch("species");
  const selectedSex = watch("sex");

  async function handleFormSubmit(data: CreatePetInput) {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Datos basicos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              placeholder="Ej: Luna"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="species">Especie *</Label>
            <Select
              value={selectedSpecies}
              onValueChange={(v) =>
                setValue("species", v as CreatePetInput["species"])
              }
            >
              <SelectTrigger id="species" className="w-full">
                <SelectValue placeholder="Seleccionar especie" />
              </SelectTrigger>
              <SelectContent>
                {speciesOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.species && (
              <p className="text-xs text-destructive">
                {errors.species.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="breed">Raza</Label>
            <Input
              id="breed"
              placeholder="Ej: Golden Retriever"
              {...register("breed")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Fecha de nacimiento *</Label>
            <Input
              id="birthDate"
              type="date"
              aria-invalid={!!errors.birthDate}
              {...register("birthDate", {
                setValueAs: (v: string) => {
                  if (!v) return "";
                  return new Date(v).toISOString();
                },
              })}
            />
            {errors.birthDate && (
              <p className="text-xs text-destructive">
                {errors.birthDate.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sex">Sexo *</Label>
            <Select
              value={selectedSex}
              onValueChange={(v) =>
                setValue("sex", v as CreatePetInput["sex"])
              }
            >
              <SelectTrigger id="sex" className="w-full">
                <SelectValue placeholder="Seleccionar sexo" />
              </SelectTrigger>
              <SelectContent>
                {sexOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              placeholder="Ej: Dorado"
              {...register("color")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">Peso (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              min="0"
              placeholder="Ej: 12.5"
              {...register("weight", { valueAsNumber: true })}
            />
            {errors.weight && (
              <p className="text-xs text-destructive">
                {errors.weight.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="microchip">Microchip</Label>
            <Input
              id="microchip"
              placeholder="Numero de microchip"
              {...register("microchip")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <button
            type="button"
            className="flex w-full items-center justify-between"
            onClick={() => setShowMedical(!showMedical)}
            aria-expanded={showMedical}
          >
            <CardTitle className="font-heading">Datos medicos</CardTitle>
            {showMedical ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </CardHeader>
        {showMedical && (
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="allergies">Alergias</Label>
              <Textarea
                id="allergies"
                placeholder="Describir alergias conocidas..."
                {...register("allergies")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicalConditions">Condiciones medicas</Label>
              <Textarea
                id="medicalConditions"
                placeholder="Condiciones medicas preexistentes..."
                {...register("medicalConditions")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentMedication">Medicacion actual</Label>
              <Textarea
                id="currentMedication"
                placeholder="Medicamentos que toma actualmente..."
                {...register("currentMedication")}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
