"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";

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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8" noValidate>
      {/* Sección datos básicos */}
      <section>
        <h2
          className="mb-6 text-lg"
          style={{
            fontFamily: "var(--font-fraunces)",
            fontStyle: "italic",
            color: "var(--warm-900)",
            fontWeight: 400,
            borderBottom: "1px solid var(--border)",
            paddingBottom: "0.75rem",
          }}
        >
          Datos basicos
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Nombre */}
          <EditField label="Nombre" required error={errors.name?.message}>
            <input
              className="input-editorial"
              placeholder="Ej: Luna"
              aria-invalid={!!errors.name}
              {...register("name", { required: "El nombre es requerido" })}
            />
          </EditField>

          {/* Especie */}
          <EditField label="Especie" required error={errors.species?.message}>
            <select
              className="input-editorial"
              value={selectedSpecies}
              onChange={(e) => setValue("species", e.target.value as PetSpecies)}
              aria-invalid={!!errors.species}
            >
              {speciesOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </EditField>

          {/* Raza */}
          <EditField label="Raza">
            <input
              className="input-editorial"
              placeholder="Ej: Golden Retriever"
              {...register("breed")}
            />
          </EditField>

          {/* Fecha nacimiento */}
          <EditField label="Fecha de nacimiento" required error={errors.birthDate?.message}>
            <input
              type="date"
              className="input-editorial"
              aria-invalid={!!errors.birthDate}
              {...register("birthDate", {
                required: "La fecha es requerida",
                setValueAs: (v: string) => {
                  if (!v) return "";
                  return new Date(v).toISOString();
                },
              })}
            />
          </EditField>

          {/* Sexo */}
          <EditField label="Sexo" required>
            <select
              className="input-editorial"
              value={selectedSex}
              onChange={(e) => setValue("sex", e.target.value as PetSex)}
            >
              {sexOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </EditField>

          {/* Color */}
          <EditField label="Color">
            <input
              className="input-editorial"
              placeholder="Ej: Dorado"
              {...register("color")}
            />
          </EditField>

          {/* Peso */}
          <EditField label="Peso (kg)" error={errors.weight?.message}>
            <input
              type="number"
              step="0.1"
              min="0"
              className="input-editorial"
              placeholder="Ej: 12.5"
              {...register("weight", { valueAsNumber: true })}
            />
          </EditField>

          {/* Microchip */}
          <EditField label="Numero de microchip">
            <input
              className="input-editorial"
              placeholder="Ej: 985141006789012"
              {...register("microchip")}
            />
          </EditField>
        </div>
      </section>

      {/* Sección datos médicos — colapsable */}
      <section>
        <button
          type="button"
          onClick={() => setShowMedical(!showMedical)}
          className="flex w-full items-center justify-between pb-3 transition-colors"
          style={{ borderBottom: "1px solid var(--border)" }}
          aria-expanded={showMedical}
        >
          <h2
            className="text-lg"
            style={{
              fontFamily: "var(--font-fraunces)",
              fontStyle: "italic",
              color: "var(--warm-900)",
              fontWeight: 400,
            }}
          >
            Datos medicos{" "}
            <span
              className="text-sm font-normal"
              style={{ fontFamily: "var(--font-inter)", color: "var(--warm-400)" }}
            >
              (opcional)
            </span>
          </h2>
          {showMedical ? (
            <ChevronUp className="h-4 w-4" style={{ color: "var(--warm-600)" }} />
          ) : (
            <ChevronDown className="h-4 w-4" style={{ color: "var(--warm-600)" }} />
          )}
        </button>

        {showMedical && (
          <div className="mt-6 grid gap-6">
            <EditField label="Alergias">
              <textarea
                className="input-editorial resize-none"
                rows={3}
                placeholder="Describir alergias conocidas..."
                {...register("allergies")}
                style={{ paddingTop: "0.5rem" }}
              />
            </EditField>
            <EditField label="Condiciones medicas">
              <textarea
                className="input-editorial resize-none"
                rows={3}
                placeholder="Condiciones medicas preexistentes..."
                {...register("medicalConditions")}
                style={{ paddingTop: "0.5rem" }}
              />
            </EditField>
            <EditField label="Medicacion actual">
              <textarea
                className="input-editorial resize-none"
                rows={3}
                placeholder="Medicamentos que toma actualmente..."
                {...register("currentMedication")}
                style={{ paddingTop: "0.5rem" }}
              />
            </EditField>
          </div>
        )}
      </section>

      {/* Error global */}
      {error && (
        <div
          role="alert"
          className="rounded px-3 py-2 text-sm"
          style={{
            background: "var(--terracotta-100)",
            color: "var(--terracotta-700)",
            fontFamily: "var(--font-inter)",
            border: "1px solid var(--terracotta-200)",
          }}
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
          style={{
            background: "var(--forest-900)",
            color: "var(--cream-25)",
            fontFamily: "var(--font-inter)",
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {submitting ? "Guardando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

// Helper field editorial
function EditField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label
        className="label-editorial"
        style={{ display: "block" }}
      >
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: "var(--terracotta-700)", marginLeft: "2px" }}>*</span>
        )}
      </label>
      {children}
      {error && (
        <p
          className="text-xs"
          role="alert"
          style={{ color: "var(--terracotta-700)", fontFamily: "var(--font-inter)" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
