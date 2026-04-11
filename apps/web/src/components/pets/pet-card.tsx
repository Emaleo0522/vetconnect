"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PawPrint } from "lucide-react";

const speciesLabels: Record<string, string> = {
  dog: "Perro",
  cat: "Gato",
  bird: "Ave",
  rabbit: "Conejo",
  other: "Otro",
};

const speciesEmoji: Record<string, string> = {
  dog: "🐕",
  cat: "🐈",
  bird: "🐦",
  rabbit: "🐇",
  other: "🐾",
};

function calculateAge(birthDate: string | null): string {
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
  return (
    <Link href={`/dashboard/pets/${id}`} className="group block">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
            {photo ? (
              <img
                src={photo}
                alt={name}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              <PawPrint className="h-8 w-8 text-muted-foreground/50" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-base font-semibold group-hover:text-primary">
              {name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {speciesEmoji[species] ?? "🐾"}{" "}
              {speciesLabels[species] ?? species}
              {breed ? ` - ${breed}` : ""}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {calculateAge(birthDate)}
              </Badge>
              {weight && (
                <Badge variant="outline" className="text-xs">
                  {parseFloat(weight)} kg
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export { calculateAge, speciesLabels };
