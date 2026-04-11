"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Syringe } from "lucide-react";

export default function VaccinationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Vacunas</h1>
        <p className="text-muted-foreground">Control de vacunacion de tus mascotas</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Syringe className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">Proximamente: calendario de vacunacion</p>
        </CardContent>
      </Card>
    </div>
  );
}
