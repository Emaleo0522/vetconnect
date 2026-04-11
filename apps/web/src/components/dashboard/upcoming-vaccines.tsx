"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Syringe } from "lucide-react";

interface UpcomingVaccine {
  petName: string;
  vaccineName: string;
  nextDoseDate: string;
}

interface UpcomingVaccinesProps {
  vaccines: UpcomingVaccine[];
  isLoading: boolean;
}

function getVaccineStatus(dateStr: string): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className?: string;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) {
    return { label: "Vencida", variant: "destructive" };
  }
  if (diffDays <= 30) {
    return {
      label: "Proxima",
      variant: "outline",
      className:
        "border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-400",
    };
  }
  return {
    label: "Al dia",
    variant: "secondary",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function UpcomingVaccines({
  vaccines,
  isLoading,
}: UpcomingVaccinesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading">
          <Syringe className="h-5 w-5 text-primary" />
          Proximas vacunas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : vaccines.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No hay vacunas programadas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Mascota</th>
                  <th className="pb-2 font-medium">Vacuna</th>
                  <th className="pb-2 font-medium">Fecha</th>
                  <th className="pb-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {vaccines.map((v, i) => {
                  const status = getVaccineStatus(v.nextDoseDate);
                  return (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2.5 font-medium">{v.petName}</td>
                      <td className="py-2.5">{v.vaccineName}</td>
                      <td className="py-2.5">{formatDate(v.nextDoseDate)}</td>
                      <td className="py-2.5">
                        <Badge
                          variant={status.variant}
                          className={status.className}
                        >
                          {status.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
