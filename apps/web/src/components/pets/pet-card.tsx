"use client";

import Link from "next/link";
import Image from "next/image";

const speciesLabels: Record<string, string> = {
  dog: "Perro",
  cat: "Gato",
  bird: "Ave",
  rabbit: "Conejo",
  other: "Otro",
};

export function calculateAge(birthDate: string | null): string {
  if (!birthDate) return "Edad desconocida";
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years === 0) {
    return `${months} ${months === 1 ? "mes" : "meses"}`;
  }
  return `${years} ${years === 1 ? "ano" : "anos"}`;
}

interface PetCardProps {
  id: string;
  name: string;
  photo: string | null;
  species: string;
  breed: string | null;
  birthDate: string | null;
  weight: string | null;
}

export function PetCard({
  id,
  name,
  photo,
  species,
  breed,
  birthDate,
  weight,
}: PetCardProps) {
  const age = calculateAge(birthDate);

  return (
    <Link href={`/dashboard/pets/${id}`} className="group block" aria-label={`Ver perfil de ${name}`}>
      <article
        className="card-editorial flex items-center gap-4 p-4 transition-all"
        style={{ minHeight: "96px" }}
      >
        {/* Foto / placeholder */}
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden"
          style={{
            borderRadius: "var(--radius-md)",
            background: "var(--cream-100)",
            border: "1px solid var(--cream-200)",
          }}
        >
          {photo ? (
            <Image
              src={photo}
              alt={name}
              width={64}
              height={64}
              className="h-full w-full object-cover"
              style={{ borderRadius: "var(--radius-md)" }}
            />
          ) : (
            <span
              className="text-2xl font-medium select-none"
              aria-hidden="true"
              style={{
                fontFamily: "var(--font-fraunces)",
                fontStyle: "italic",
                color: "var(--forest-400)",
              }}
            >
              {name[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h3
            className="truncate text-base font-medium leading-tight transition-colors group-hover:underline"
            style={{
              fontFamily: "var(--font-fraunces)",
              fontStyle: "italic",
              color: "var(--warm-900)",
            }}
          >
            {name}
          </h3>
          <p
            className="mt-0.5 truncate text-sm"
            style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}
          >
            {speciesLabels[species] ?? species}
            {breed ? ` · ${breed}` : ""}
          </p>
          {/* Tags edad + peso */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span
              className="rounded-full px-2 py-0.5 text-[11px]"
              style={{
                background: "var(--cream-100)",
                color: "var(--warm-700)",
                fontFamily: "var(--font-inter)",
                border: "1px solid var(--cream-200)",
              }}
            >
              {age}
            </span>
            {weight && (
              <span
                className="rounded-full px-2 py-0.5 text-[11px]"
                style={{
                  background: "var(--cream-100)",
                  color: "var(--warm-700)",
                  fontFamily: "var(--font-inter)",
                  border: "1px solid var(--cream-200)",
                }}
              >
                {parseFloat(weight)} kg
              </span>
            )}
          </div>
        </div>

        {/* Arrow indicator */}
        <span
          className="shrink-0 text-sm transition-transform group-hover:translate-x-0.5"
          style={{ color: "var(--warm-400)" }}
          aria-hidden="true"
        >
          →
        </span>
      </article>
    </Link>
  );
}

export { speciesLabels };
