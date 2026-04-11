"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  PawPrint,
  Pencil,
  Trash2,
  Info,
  FileText,
  Syringe,
  QrCode,
  Stethoscope,
  Pill,
  Bug,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { calculateAge, speciesLabels } from "@/components/pets/pet-card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PetDetail {
  id: string;
  ownerId: string;
  name: string;
  photo: string | null;
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
  vetId: string | null;
  uuid: string;
  createdAt: string;
  updatedAt: string;
}

interface MedicalRecord {
  id: string;
  petId: string;
  vetId: string | null;
  type: string;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
  date: string;
  createdAt: string;
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

interface MedicalHistory {
  medicalRecords: MedicalRecord[];
  vaccinations: Vaccination[];
  treatments: Treatment[];
}

const sexLabels: Record<string, string> = {
  male: "Macho",
  female: "Hembra",
};

const recordTypeLabels: Record<string, string> = {
  consultation: "Consulta",
  treatment: "Tratamiento",
  surgery: "Cirugia",
  other: "Otro",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getVaccineBadge(nextDoseDate: string | null): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className?: string;
} {
  if (!nextDoseDate)
    return { label: "Sin proxima", variant: "outline" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(nextDoseDate);
  date.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) return { label: "Vencida", variant: "destructive" };
  if (diffDays <= 30)
    return {
      label: "Proxima",
      variant: "outline",
      className:
        "border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-400",
    };
  return {
    label: "Al dia",
    variant: "secondary",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function PetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [pet, setPet] = useState<PetDetail | null>(null);
  const [history, setHistory] = useState<MedicalHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [petData, historyData] = await Promise.all([
          api.get<PetDetail>(`/api/pets/${id}`),
          api.get<MedicalHistory>(`/api/pets/${id}/medical-history`),
        ]);
        setPet(petData);
        setHistory(historyData);
      } catch {
        // api.ts handles 401
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/api/pets/${id}`);
      router.push("/dashboard/pets");
    } catch {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <PawPrint className="h-12 w-12 text-muted-foreground/40" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/pets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Button>
          </Link>
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted">
            {pet.photo ? (
              <img
                src={pet.photo}
                alt={pet.name}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <PawPrint className="h-10 w-10 text-muted-foreground/50" />
            )}
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold">{pet.name}</h1>
            <p className="text-muted-foreground">
              {speciesLabels[pet.species] ?? pet.species}
              {pet.breed ? ` - ${pet.breed}` : ""}
            </p>
            <Badge variant="outline" className="mt-1">
              {calculateAge(pet.birthDate)}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/pets/${id}/edit`}>
            <Button variant="outline" className="gap-2">
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          </Link>
          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList variant="line">
          <TabsTrigger value="info" className="gap-1.5">
            <Info className="h-4 w-4" />
            Informacion
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="vaccines" className="gap-1.5">
            <Syringe className="h-4 w-4" />
            Vacunas
          </TabsTrigger>
          <TabsTrigger value="qr" className="gap-1.5">
            <QrCode className="h-4 w-4" />
            QR
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info">
          <Card>
            <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
              <InfoField label="Nombre" value={pet.name} />
              <InfoField
                label="Especie"
                value={speciesLabels[pet.species] ?? pet.species}
              />
              <InfoField label="Raza" value={pet.breed} />
              <InfoField
                label="Fecha de nacimiento"
                value={pet.birthDate ? formatDate(pet.birthDate) : null}
              />
              <InfoField label="Sexo" value={sexLabels[pet.sex] ?? pet.sex} />
              <InfoField label="Color" value={pet.color} />
              <InfoField
                label="Peso"
                value={pet.weight ? `${parseFloat(pet.weight)} kg` : null}
              />
              <InfoField label="Microchip" value={pet.microchip} />
              <InfoField label="Alergias" value={pet.allergies} />
              <InfoField
                label="Condiciones medicas"
                value={pet.medicalConditions}
              />
              <InfoField
                label="Medicacion actual"
                value={pet.currentMedication}
              />
              <InfoField label="UUID" value={pet.uuid} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical History Tab */}
        <TabsContent value="history">
          <div className="space-y-4">
            {/* Medical Records */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-base">
                  <Stethoscope className="h-4 w-4" />
                  Consultas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!history?.medicalRecords.length ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Sin registros de consultas.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {history.medicalRecords.map((record) => (
                      <div
                        key={record.id}
                        className="relative border-l-2 border-primary/30 pl-4"
                      >
                        <div className="absolute -left-1.5 top-0.5 h-3 w-3 rounded-full bg-primary" />
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">
                              {recordTypeLabels[record.type] ?? record.type}
                            </p>
                            {record.diagnosis && (
                              <p className="text-sm text-muted-foreground">
                                Diagnostico: {record.diagnosis}
                              </p>
                            )}
                            {record.treatment && (
                              <p className="text-sm text-muted-foreground">
                                Tratamiento: {record.treatment}
                              </p>
                            )}
                            {record.notes && (
                              <p className="text-sm text-muted-foreground">
                                Notas: {record.notes}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatDate(record.date)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Treatments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-base">
                  <Pill className="h-4 w-4" />
                  Tratamientos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!history?.treatments.length ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Sin tratamientos registrados.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {history.treatments.map((t) => (
                      <div
                        key={t.id}
                        className="relative border-l-2 border-secondary/30 pl-4"
                      >
                        <div className="absolute -left-1.5 top-0.5 h-3 w-3 rounded-full bg-secondary" />
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{t.name}</p>
                            <p className="text-sm capitalize text-muted-foreground">
                              {t.type}
                            </p>
                            {t.notes && (
                              <p className="text-sm text-muted-foreground">
                                {t.notes}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatDate(t.date)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vaccines Tab */}
        <TabsContent value="vaccines">
          <Card>
            <CardContent className="p-6">
              {!history?.vaccinations.length ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Sin vacunas registradas.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Vacuna</th>
                        <th className="pb-2 font-medium">Fecha</th>
                        <th className="pb-2 font-medium">Lote</th>
                        <th className="pb-2 font-medium">Proxima dosis</th>
                        <th className="pb-2 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.vaccinations.map((v) => {
                        const status = getVaccineBadge(v.nextDoseDate);
                        return (
                          <tr key={v.id} className="border-b last:border-0">
                            <td className="py-2.5 font-medium">{v.name}</td>
                            <td className="py-2.5">{formatDate(v.date)}</td>
                            <td className="py-2.5">{v.batch ?? "-"}</td>
                            <td className="py-2.5">
                              {v.nextDoseDate
                                ? formatDate(v.nextDoseDate)
                                : "-"}
                            </td>
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
        </TabsContent>

        {/* QR Tab */}
        <TabsContent value="qr">
          <Card>
            <CardContent className="flex flex-col items-center gap-6 py-8">
              <div className="rounded-xl border bg-white p-4">
                <QRCodeSVG
                  value={`vetconnect://pet/${pet.uuid}`}
                  size={200}
                  level="H"
                />
              </div>
              <div className="text-center">
                <p className="font-medium">{pet.name}</p>
                <p className="text-sm text-muted-foreground">
                  UUID: {pet.uuid}
                </p>
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `${pet.name} - VetConnect`,
                      text: `Perfil de ${pet.name} en VetConnect`,
                      url: `${window.location.origin}/pet/${pet.uuid}`,
                    });
                  } else {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/pet/${pet.uuid}`,
                    );
                  }
                }}
              >
                <QrCode className="h-4 w-4" />
                Compartir perfil
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar mascota</DialogTitle>
            <DialogDescription>
              Estas seguro de que queres eliminar a {pet.name}? Esta accion no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDelete(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5">{value ?? "-"}</p>
    </div>
  );
}
