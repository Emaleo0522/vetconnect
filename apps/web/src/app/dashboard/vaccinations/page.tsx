"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Syringe,
  PawPrint,
  Plus,
  Pill,
  Share2,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PetData {
  id: string;
  name: string;
  photo: string | null;
  species: string;
  breed: string | null;
  birthDate: string | null;
  weight: string | null;
}

interface Vaccination {
  id: string;
  petId: string;
  name: string;
  date: string;
  vetId: string | null;
  batch: string | null;
  nextDoseDate: string | null;
  createdAt: string;
}

interface Treatment {
  id: string;
  petId: string;
  type: string;
  name: string;
  date: string;
  vetId: string | null;
  notes: string | null;
  createdAt: string;
}

interface PetVaccineData {
  pet: PetData;
  vaccinations: Vaccination[];
  treatments: Treatment[];
  expanded: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const speciesEmoji: Record<string, string> = {
  dog: "\uD83D\uDC15",
  cat: "\uD83D\uDC08",
  bird: "\uD83D\uDC26",
  rabbit: "\uD83D\uDC07",
  other: "\uD83D\uDC3E",
};

const treatmentTypeLabels: Record<string, string> = {
  deworming: "Desparasitacion",
  surgery: "Cirugia",
  therapy: "Terapia",
  other: "Otro",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getVaccineStatus(nextDoseDate: string | null): {
  label: string;
  icon: React.ElementType;
  className: string;
  badgeClass: string;
  priority: number;
} {
  if (!nextDoseDate) {
    return {
      label: "Sin proxima",
      icon: Clock,
      className: "text-muted-foreground",
      badgeClass: "",
      priority: 3,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(nextDoseDate);
  date.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    return {
      label: "Vencida",
      icon: AlertTriangle,
      className: "text-destructive",
      badgeClass:
        "bg-destructive/10 text-destructive border-destructive/20",
      priority: 0,
    };
  }
  if (diffDays <= 30) {
    return {
      label: `En ${diffDays} dias`,
      icon: Clock,
      className: "text-amber-600 dark:text-amber-400",
      badgeClass:
        "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700",
      priority: 1,
    };
  }
  return {
    label: "Al dia",
    icon: CheckCircle2,
    className: "text-emerald-600 dark:text-emerald-400",
    badgeClass:
      "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700",
    priority: 2,
  };
}

function getGlobalSummary(data: PetVaccineData[]) {
  let total = 0;
  let alDia = 0;
  let proximas = 0;
  let vencidas = 0;

  for (const item of data) {
    for (const v of item.vaccinations) {
      total++;
      const status = getVaccineStatus(v.nextDoseDate);
      if (status.priority === 0) vencidas++;
      else if (status.priority === 1) proximas++;
      else if (status.priority === 2) alDia++;
    }
  }

  return { total, alDia, proximas, vencidas };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function VaccinationsPage() {
  const [data, setData] = useState<PetVaccineData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state for adding vaccine
  const [showVaccineDialog, setShowVaccineDialog] = useState(false);
  const [vaccineTargetPetId, setVaccineTargetPetId] = useState<string | null>(
    null
  );
  const [vaccineName, setVaccineName] = useState("");
  const [vaccineDate, setVaccineDate] = useState("");
  const [vaccineBatch, setVaccineBatch] = useState("");
  const [vaccineNextDose, setVaccineNextDose] = useState("");
  const [isSavingVaccine, setIsSavingVaccine] = useState(false);

  // Dialog state for adding treatment
  const [showTreatmentDialog, setShowTreatmentDialog] = useState(false);
  const [treatmentTargetPetId, setTreatmentTargetPetId] = useState<
    string | null
  >(null);
  const [treatmentType, setTreatmentType] = useState("deworming");
  const [treatmentName, setTreatmentName] = useState("");
  const [treatmentDate, setTreatmentDate] = useState("");
  const [treatmentNotes, setTreatmentNotes] = useState("");
  const [isSavingTreatment, setIsSavingTreatment] = useState(false);

  // Share state
  const [sharingPetId, setSharingPetId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const petsRes = await api.get<{ items: PetData[] }>("/api/pets");
      const pets = petsRes.items;

      const petDataPromises = pets.map(async (pet) => {
        const [vaccinations, treatments] = await Promise.allSettled([
          api.get<Vaccination[]>(`/api/pets/${pet.id}/vaccinations`),
          api.get<Treatment[]>(`/api/pets/${pet.id}/treatments`),
        ]);

        return {
          pet,
          vaccinations:
            vaccinations.status === "fulfilled"
              ? Array.isArray(vaccinations.value)
                ? vaccinations.value
                : []
              : [],
          treatments:
            treatments.status === "fulfilled"
              ? Array.isArray(treatments.value)
                ? treatments.value
                : []
              : [],
          expanded: true,
        };
      });

      const results = await Promise.all(petDataPromises);
      setData(results);
    } catch {
      // api.ts handles 401 redirect
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function togglePet(petId: string) {
    setData((prev) =>
      prev.map((item) =>
        item.pet.id === petId
          ? { ...item, expanded: !item.expanded }
          : item
      )
    );
  }

  // -- Add Vaccine --
  function openVaccineDialog(petId: string) {
    setVaccineTargetPetId(petId);
    setVaccineName("");
    setVaccineDate(new Date().toISOString().split("T")[0]);
    setVaccineBatch("");
    setVaccineNextDose("");
    setShowVaccineDialog(true);
  }

  async function handleAddVaccine() {
    if (!vaccineTargetPetId || !vaccineName.trim() || !vaccineDate) {
      toast.error("Nombre y fecha son obligatorios");
      return;
    }

    setIsSavingVaccine(true);
    try {
      const body: Record<string, string | undefined> = {
        name: vaccineName.trim(),
        date: new Date(vaccineDate).toISOString(),
      };
      if (vaccineBatch.trim()) body.batch = vaccineBatch.trim();
      if (vaccineNextDose) {
        body.nextDoseDate = new Date(vaccineNextDose).toISOString();
      }

      await api.post(`/api/pets/${vaccineTargetPetId}/vaccinations`, body);
      toast.success("Vacuna registrada");
      setShowVaccineDialog(false);
      fetchData();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Error al registrar vacuna");
      }
    } finally {
      setIsSavingVaccine(false);
    }
  }

  // -- Add Treatment --
  function openTreatmentDialog(petId: string) {
    setTreatmentTargetPetId(petId);
    setTreatmentType("deworming");
    setTreatmentName("");
    setTreatmentDate(new Date().toISOString().split("T")[0]);
    setTreatmentNotes("");
    setShowTreatmentDialog(true);
  }

  async function handleAddTreatment() {
    if (!treatmentTargetPetId || !treatmentName.trim() || !treatmentDate) {
      toast.error("Nombre y fecha son obligatorios");
      return;
    }

    setIsSavingTreatment(true);
    try {
      const body: Record<string, string | undefined> = {
        type: treatmentType,
        name: treatmentName.trim(),
        date: new Date(treatmentDate).toISOString(),
      };
      if (treatmentNotes.trim()) body.notes = treatmentNotes.trim();

      await api.post(
        `/api/pets/${treatmentTargetPetId}/treatments`,
        body
      );
      toast.success("Tratamiento registrado");
      setShowTreatmentDialog(false);
      fetchData();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Error al registrar tratamiento");
      }
    } finally {
      setIsSavingTreatment(false);
    }
  }

  // -- Share Vaccination Card --
  async function handleShare(petId: string) {
    setSharingPetId(petId);
    try {
      const result = await api.get<{ token: string; expiresIn: string }>(
        `/api/pets/${petId}/vaccination-card`
      );
      const shareUrl = `${window.location.origin}/shared/vaccination-card/${result.token}`;

      if (navigator.share) {
        await navigator.share({
          title: "Cartilla Vacunatoria - VetConnect",
          text: "Mira la cartilla vacunatoria de mi mascota",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copiado al portapapeles (valido por 24h)");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        // User cancelled share sheet — not an error
      }
    } finally {
      setSharingPetId(null);
    }
  }

  const summary = getGlobalSummary(data);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold">
          Cartilla Vacunatoria
        </h1>
        <p className="text-muted-foreground">
          Control de vacunacion y tratamientos de tus mascotas
        </p>
      </div>

      {/* Summary Cards */}
      {!isLoading && data.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Total vacunas"
            value={summary.total}
            icon={<Syringe className="h-4 w-4 text-primary" />}
          />
          <SummaryCard
            label="Al dia"
            value={summary.alDia}
            icon={
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            }
          />
          <SummaryCard
            label="Proximas"
            value={summary.proximas}
            icon={
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            }
            highlight={summary.proximas > 0}
          />
          <SummaryCard
            label="Vencidas"
            value={summary.vencidas}
            icon={
              <AlertTriangle className="h-4 w-4 text-destructive" />
            }
            highlight={summary.vencidas > 0}
            variant="destructive"
          />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-4 animate-pulse">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-1/3 rounded bg-muted" />
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-4 w-2/3 rounded bg-muted" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && data.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <PawPrint className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium">No tenes mascotas registradas</p>
              <p className="text-sm text-muted-foreground">
                Registra tu primera mascota para gestionar su cartilla
                vacunatoria.
              </p>
            </div>
            <Link href="/dashboard/pets/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Agregar mascota
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Pet Accordion List */}
      {!isLoading &&
        data.map(({ pet, vaccinations, treatments, expanded }) => (
          <Card key={pet.id}>
            {/* Pet Header — clickable to expand/collapse */}
            <button
              type="button"
              className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50"
              onClick={() => togglePet(pet.id)}
              aria-expanded={expanded}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
                {speciesEmoji[pet.species] ?? "\uD83D\uDC3E"}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-base font-semibold">
                  {pet.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {vaccinations.length}{" "}
                  {vaccinations.length === 1 ? "vacuna" : "vacunas"} &middot;{" "}
                  {treatments.length}{" "}
                  {treatments.length === 1
                    ? "tratamiento"
                    : "tratamientos"}
                </p>
              </div>

              {/* Quick status badges */}
              <div className="hidden items-center gap-1.5 sm:flex">
                {(() => {
                  const vencidas = vaccinations.filter(
                    (v) => getVaccineStatus(v.nextDoseDate).priority === 0
                  ).length;
                  const proximas = vaccinations.filter(
                    (v) => getVaccineStatus(v.nextDoseDate).priority === 1
                  ).length;
                  return (
                    <>
                      {vencidas > 0 && (
                        <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                          {vencidas} vencida{vencidas > 1 ? "s" : ""}
                        </Badge>
                      )}
                      {proximas > 0 && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                          {proximas} proxima{proximas > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </>
                  );
                })()}
              </div>

              {expanded ? (
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
            </button>

            {/* Expanded Content */}
            {expanded && (
              <CardContent className="space-y-6 border-t px-4 pb-6 pt-4">
                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => openVaccineDialog(pet.id)}
                  >
                    <Syringe className="h-3.5 w-3.5" />
                    Agregar vacuna
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => openTreatmentDialog(pet.id)}
                  >
                    <Pill className="h-3.5 w-3.5" />
                    Agregar tratamiento
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => handleShare(pet.id)}
                    disabled={sharingPetId === pet.id}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    {sharingPetId === pet.id
                      ? "Generando..."
                      : "Compartir cartilla"}
                  </Button>
                </div>

                {/* Vaccinations Table */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Syringe className="h-4 w-4 text-primary" />
                    Vacunas
                  </h3>
                  {vaccinations.length === 0 ? (
                    <p className="py-3 text-center text-sm text-muted-foreground">
                      Sin vacunas registradas.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                            <th className="px-3 py-2 font-medium">
                              Vacuna
                            </th>
                            <th className="px-3 py-2 font-medium">
                              Fecha
                            </th>
                            <th className="hidden px-3 py-2 font-medium sm:table-cell">
                              Lote
                            </th>
                            <th className="px-3 py-2 font-medium">
                              Proxima dosis
                            </th>
                            <th className="px-3 py-2 font-medium">
                              Estado
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {vaccinations
                            .sort(
                              (a, b) =>
                                new Date(b.date).getTime() -
                                new Date(a.date).getTime()
                            )
                            .map((v) => {
                              const status = getVaccineStatus(
                                v.nextDoseDate
                              );
                              const StatusIcon = status.icon;
                              return (
                                <tr
                                  key={v.id}
                                  className="border-b last:border-0"
                                >
                                  <td className="px-3 py-2.5 font-medium">
                                    {v.name}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    {formatDate(v.date)}
                                  </td>
                                  <td className="hidden px-3 py-2.5 sm:table-cell">
                                    {v.batch ?? "-"}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    {v.nextDoseDate
                                      ? formatDate(v.nextDoseDate)
                                      : "-"}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "gap-1 text-xs",
                                        status.badgeClass
                                      )}
                                    >
                                      <StatusIcon className="h-3 w-3" />
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
                </div>

                {/* Treatments Table */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Pill className="h-4 w-4 text-secondary-foreground" />
                    Tratamientos
                  </h3>
                  {treatments.length === 0 ? (
                    <p className="py-3 text-center text-sm text-muted-foreground">
                      Sin tratamientos registrados.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                            <th className="px-3 py-2 font-medium">
                              Tratamiento
                            </th>
                            <th className="px-3 py-2 font-medium">
                              Tipo
                            </th>
                            <th className="px-3 py-2 font-medium">
                              Fecha
                            </th>
                            <th className="hidden px-3 py-2 font-medium sm:table-cell">
                              Notas
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {treatments
                            .sort(
                              (a, b) =>
                                new Date(b.date).getTime() -
                                new Date(a.date).getTime()
                            )
                            .map((t) => (
                              <tr
                                key={t.id}
                                className="border-b last:border-0"
                              >
                                <td className="px-3 py-2.5 font-medium">
                                  {t.name}
                                </td>
                                <td className="px-3 py-2.5">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {treatmentTypeLabels[t.type] ?? t.type}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2.5">
                                  {formatDate(t.date)}
                                </td>
                                <td className="hidden max-w-[200px] truncate px-3 py-2.5 text-muted-foreground sm:table-cell">
                                  {t.notes ?? "-"}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Link to pet detail */}
                <div className="flex justify-end">
                  <Link
                    href={`/dashboard/pets/${pet.id}`}
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <Link2 className="h-3 w-3" />
                    Ver perfil completo de {pet.name}
                  </Link>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

      {/* Add Vaccine Dialog */}
      <Dialog open={showVaccineDialog} onOpenChange={setShowVaccineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar vacuna</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="vax-name">Nombre de la vacuna *</Label>
              <Input
                id="vax-name"
                placeholder="Ej: Quintuple, Antirrabica..."
                value={vaccineName}
                onChange={(e) => setVaccineName(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vax-date">Fecha de aplicacion *</Label>
                <Input
                  id="vax-date"
                  type="date"
                  value={vaccineDate}
                  onChange={(e) => setVaccineDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vax-batch">Lote</Label>
                <Input
                  id="vax-batch"
                  placeholder="Numero de lote"
                  value={vaccineBatch}
                  onChange={(e) => setVaccineBatch(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vax-next">Proxima dosis</Label>
              <Input
                id="vax-next"
                type="date"
                value={vaccineNextDose}
                onChange={(e) => setVaccineNextDose(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowVaccineDialog(false)}
              disabled={isSavingVaccine}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddVaccine}
              disabled={isSavingVaccine}
              className="gap-1.5"
            >
              <Syringe className="h-4 w-4" />
              {isSavingVaccine ? "Guardando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Treatment Dialog */}
      <Dialog
        open={showTreatmentDialog}
        onOpenChange={setShowTreatmentDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar tratamiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="treat-type">Tipo</Label>
              <select
                id="treat-type"
                value={treatmentType}
                onChange={(e) => setTreatmentType(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="deworming">Desparasitacion</option>
                <option value="surgery">Cirugia</option>
                <option value="therapy">Terapia</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="treat-name">Nombre *</Label>
              <Input
                id="treat-name"
                placeholder="Ej: Ivermectina, Castracion..."
                value={treatmentName}
                onChange={(e) => setTreatmentName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="treat-date">Fecha *</Label>
              <Input
                id="treat-date"
                type="date"
                value={treatmentDate}
                onChange={(e) => setTreatmentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="treat-notes">Notas</Label>
              <Input
                id="treat-notes"
                placeholder="Observaciones adicionales"
                value={treatmentNotes}
                onChange={(e) => setTreatmentNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTreatmentDialog(false)}
              disabled={isSavingTreatment}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddTreatment}
              disabled={isSavingTreatment}
              className="gap-1.5"
            >
              <Pill className="h-4 w-4" />
              {isSavingTreatment ? "Guardando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary Card
// ---------------------------------------------------------------------------

function SummaryCard({
  label,
  value,
  icon,
  highlight,
  variant,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  highlight?: boolean;
  variant?: "destructive";
}) {
  return (
    <Card
      className={cn(
        "transition-shadow",
        highlight && variant === "destructive" && "border-destructive/30",
        highlight && !variant && "border-amber-400/30"
      )}
    >
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
