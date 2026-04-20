"use client";

import { useEffect, useState, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
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
  Pencil,
  Trash2,
  Info,
  FileText,
  Syringe,
  QrCode,
  Stethoscope,
  Pill,
  Camera,
  Loader2,
  Plus,
  Download,
  Upload,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { calculateAge, speciesLabels } from "@/components/pets/pet-card";
import { toast } from "sonner";

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

interface PetDocument {
  id: string;
  petId: string;
  name: string;
  url: string;
  size: number;
  createdAt: string;
}

interface MedicalHistory {
  medicalRecords: MedicalRecord[];
  vaccinations: Vaccination[];
  treatments: Treatment[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sexLabels: Record<string, string> = { male: "Macho", female: "Hembra" };

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

function vaccineStatus(nextDoseDate: string | null): {
  label: string;
  color: string;
  bg: string;
} {
  if (!nextDoseDate) return { label: "Sin próxima", color: "var(--warm-600)", bg: "var(--cream-100)" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(nextDoseDate);
  date.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)
    return { label: "Vencida", color: "var(--terracotta-700)", bg: "var(--terracotta-100)" };
  if (diffDays <= 30)
    return { label: "Próxima", color: "#92730A", bg: "#FEF9E7" };
  return { label: "Al día", color: "var(--forest-700)", bg: "var(--forest-50)" };
}

// ---------------------------------------------------------------------------
// Sub-componentes T23 — Modal vacuna
// ---------------------------------------------------------------------------

interface VaccineFormData {
  name: string;
  date: string;
  nextDoseDate: string;
  batch: string;
  notes: string;
}

const COMMON_VACCINES = [
  "Antirrábica",
  "Cuádruple (DHPP)",
  "Séxtuple",
  "Leucemia felina",
  "Calicivirus",
  "Panleucopenia",
  "Leptospirosis",
  "Bordetella",
  "Otra",
];

function VaccineModal({
  petId,
  open,
  onClose,
  onAdded,
}: {
  petId: string;
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState<VaccineFormData>({
    name: "",
    date: new Date().toISOString().split("T")[0],
    nextDoseDate: "",
    batch: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof VaccineFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.date) {
      setError("Completa el nombre y la fecha");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.post(`/api/pets/${petId}/vaccinations`, {
        name: form.name,
        date: new Date(form.date).toISOString(),
        nextDoseDate: form.nextDoseDate ? new Date(form.nextDoseDate).toISOString() : null,
        batch: form.batch || null,
        notes: form.notes || null,
      });
      toast.success("Vacuna registrada");
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle
            style={{ fontFamily: "var(--font-fraunces)", fontStyle: "italic", fontWeight: 400 }}
          >
            Agregar vacuna
          </DialogTitle>
          <DialogDescription style={{ fontFamily: "var(--font-inter)", fontSize: "13px" }}>
            Registra la vacuna aplicada y la proxima dosis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2" noValidate>
          {/* Nombre / tipo */}
          <div className="space-y-1">
            <label className="label-editorial" style={{ display: "block" }}>
              Vacuna <span style={{ color: "var(--terracotta-700)" }}>*</span>
            </label>
            <select
              className="input-editorial"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            >
              <option value="">Seleccionar...</option>
              {COMMON_VACCINES.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            {form.name === "Otra" && (
              <input
                type="text"
                className="input-editorial mt-2"
                placeholder="Nombre de la vacuna"
                onChange={(e) => update("name", e.target.value)}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="label-editorial" style={{ display: "block" }}>
                Fecha aplicacion <span style={{ color: "var(--terracotta-700)" }}>*</span>
              </label>
              <input
                type="date"
                className="input-editorial"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="label-editorial" style={{ display: "block" }}>Proxima dosis</label>
              <input
                type="date"
                className="input-editorial"
                value={form.nextDoseDate}
                onChange={(e) => update("nextDoseDate", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="label-editorial" style={{ display: "block" }}>Numero de lote</label>
            <input
              type="text"
              className="input-editorial"
              value={form.batch}
              onChange={(e) => update("batch", e.target.value)}
              placeholder="Ej: ABC1234"
            />
          </div>

          <div className="space-y-1">
            <label className="label-editorial" style={{ display: "block" }}>Notas</label>
            <textarea
              className="input-editorial resize-none"
              rows={2}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Observaciones adicionales..."
              style={{ paddingTop: "0.5rem" }}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded px-3 py-2 text-xs"
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

          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded px-4 py-2 text-sm transition-colors"
              style={{
                border: "1px solid var(--border-strong)",
                background: "transparent",
                color: "var(--warm-700)",
                fontFamily: "var(--font-inter)",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60"
              style={{
                background: "var(--forest-900)",
                color: "var(--cream-25)",
                fontFamily: "var(--font-inter)",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {loading ? "Guardando..." : "Guardar vacuna"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// T24 — Drop zone PDF editorial
// ---------------------------------------------------------------------------

function PdfDropZone({
  petId,
  onUploaded,
}: {
  petId: string;
  onUploaded: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    // Validar tipo PDF
    if (file.type !== "application/pdf") {
      setUploadError("Solo se permiten archivos PDF");
      return;
    }
    // Validar tamaño 10MB
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("El archivo no puede superar 10 MB");
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      await api.upload<{ url: string }>(
        `/api/pets/${petId}/documents`,
        "document",
        file,
      );
      toast.success("Documento subido correctamente");
      onUploaded();
    } catch {
      setUploadError("Error al subir el documento. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div>
      <button
        type="button"
        className={`dropzone-editorial w-full ${dragOver ? "drag-over" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        disabled={uploading}
        aria-label="Subir documento PDF"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleChange}
          aria-hidden="true"
        />
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: dragOver ? "var(--forest-100)" : "var(--cream-100)" }}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--forest-600)" }} />
          ) : (
            <Upload className="h-6 w-6" style={{ color: uploading ? "var(--warm-400)" : "var(--forest-600)" }} />
          )}
        </div>
        <div className="text-center">
          <p
            className="text-sm font-medium"
            style={{ fontFamily: "var(--font-inter)", color: "var(--warm-800)" }}
          >
            {uploading ? "Subiendo..." : "Arrastra un PDF aqui"}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ fontFamily: "var(--font-inter)", color: "var(--warm-500, var(--warm-600))" }}
          >
            o haz clic para seleccionar · PDF hasta 10 MB
          </p>
        </div>
      </button>
      {uploadError && (
        <p
          className="mt-2 text-xs"
          role="alert"
          style={{ color: "var(--terracotta-700)", fontFamily: "var(--font-inter)" }}
        >
          {uploadError}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// T22 — Página principal perfil mascota
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
  const [documents, setDocuments] = useState<PetDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showVaccineModal, setShowVaccineModal] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const [petData, historyData] = await Promise.all([
        api.get<PetDetail>(`/api/pets/${id}`),
        api.get<MedicalHistory>(`/api/pets/${id}/medical-history`),
      ]);
      setPet(petData);
      setHistory(historyData);

      // Documentos — endpoint puede no existir en MVP
      try {
        const docs = await api.get<PetDocument[]>(`/api/pets/${id}/documents`);
        setDocuments(docs ?? []);
      } catch {
        setDocuments([]);
      }
    } catch {
      // api.ts handles 401
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/api/pets/${id}`);
      router.push("/dashboard/pets");
    } catch {
      setDeleting(false);
      toast.error("Error al eliminar la mascota");
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Solo se permiten imagenes JPEG, PNG o WebP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5 MB");
      return;
    }

    setUploadingPhoto(true);
    try {
      const result = await api.upload<{ photoUrl: string }>(
        `/api/pets/${id}/photo`,
        "photo",
        file,
      );
      setPet((prev) => (prev ? { ...prev, photo: result.photoUrl } : prev));
      toast.success("Foto actualizada");
    } catch {
      toast.error("Error al subir la foto");
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton-warm" style={{ height: "24px", width: "120px" }} />
        <div className="flex gap-5">
          <div className="skeleton-warm" style={{ height: "80px", width: "80px", borderRadius: "var(--radius-md)" }} />
          <div className="flex-1 space-y-3">
            <div className="skeleton-warm" style={{ height: "28px", width: "200px" }} />
            <div className="skeleton-warm" style={{ height: "16px", width: "140px" }} />
          </div>
        </div>
        <div className="skeleton-warm" style={{ height: "320px" }} />
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

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Link
        href="/dashboard/pets"
        className="flex items-center gap-1 text-sm transition-colors hover:underline"
        style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Mis mascotas
      </Link>

      {/* Header con foto + nombre + acciones */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-5">
          {/* Avatar con cámara */}
          <div className="relative shrink-0">
            <div
              className="flex h-20 w-20 items-center justify-center overflow-hidden"
              style={{ borderRadius: "var(--radius-md)", background: "var(--cream-100)", border: "1px solid var(--cream-200)" }}
            >
              {pet.photo ? (
                <Image
                  src={pet.photo}
                  alt={pet.name}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                  style={{ borderRadius: "var(--radius-md)" }}
                />
              ) : (
                <span
                  className="text-3xl font-medium select-none"
                  style={{ fontFamily: "var(--font-fraunces)", fontStyle: "italic", color: "var(--forest-400)" }}
                  aria-hidden="true"
                >
                  {pet.name[0]?.toUpperCase() ?? "?"}
                </span>
              )}
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoUpload}
              aria-label="Cambiar foto"
            />
            <button
              type="button"
              disabled={uploadingPhoto}
              onClick={() => photoInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
              style={{
                background: "var(--forest-900)",
                color: "var(--cream-25)",
                boxShadow: "var(--shadow-sm)",
              }}
              aria-label="Cambiar foto de mascota"
            >
              {uploadingPhoto ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Camera className="h-3 w-3" />
              )}
            </button>
          </div>

          {/* Nombre + info */}
          <div>
            <h1
              className="text-3xl leading-tight"
              style={{
                fontFamily: "var(--font-fraunces)",
                fontStyle: "italic",
                color: "var(--warm-900)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
              }}
            >
              {pet.name}
            </h1>
            <p
              className="mt-1 text-sm"
              style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}
            >
              {speciesLabels[pet.species] ?? pet.species}
              {pet.breed ? ` · ${pet.breed}` : ""}
            </p>
            <span
              className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px]"
              style={{
                background: "var(--cream-100)",
                color: "var(--warm-700)",
                fontFamily: "var(--font-inter)",
                border: "1px solid var(--cream-200)",
              }}
            >
              {calculateAge(pet.birthDate)}
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/dashboard/pets/${id}/edit`}
            className="flex items-center gap-1.5 rounded px-3.5 py-2 text-sm font-medium transition-colors"
            style={{
              border: "1px solid var(--border-strong)",
              color: "var(--warm-700)",
              fontFamily: "var(--font-inter)",
              background: "transparent",
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Link>
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-1.5 rounded px-3.5 py-2 text-sm font-medium transition-colors"
            style={{
              background: "var(--terracotta-100)",
              color: "var(--terracotta-700)",
              fontFamily: "var(--font-inter)",
              border: "1px solid var(--terracotta-200)",
              cursor: "pointer",
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
          </button>
        </div>
      </div>

      {/* Tabs editoriales */}
      <Tabs defaultValue="info">
        <TabsList variant="line">
          <TabsTrigger value="info" className="gap-1.5">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            Información
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="vaccines" className="gap-1.5">
            <Syringe className="h-3.5 w-3.5" aria-hidden="true" />
            Vacunas
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="qr" className="gap-1.5">
            <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
            QR
          </TabsTrigger>
        </TabsList>

        {/* --- Tab: Información --- */}
        <TabsContent value="info">
          <div
            className="card-editorial mt-4 grid gap-5 p-6 sm:grid-cols-2"
          >
            <InfoField label="Nombre" value={pet.name} />
            <InfoField label="Especie" value={speciesLabels[pet.species] ?? pet.species} />
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
            {pet.allergies && (
              <div className="sm:col-span-2">
                <InfoField label="Alergias" value={pet.allergies} />
              </div>
            )}
            {pet.medicalConditions && (
              <div className="sm:col-span-2">
                <InfoField label="Condiciones medicas" value={pet.medicalConditions} />
              </div>
            )}
            {pet.currentMedication && (
              <div className="sm:col-span-2">
                <InfoField label="Medicacion actual" value={pet.currentMedication} />
              </div>
            )}
          </div>
        </TabsContent>

        {/* --- Tab: Historial --- */}
        <TabsContent value="history">
          <div className="mt-4 space-y-6">
            {/* Consultas */}
            <TimelineSection
              title="Consultas"
              Icon={Stethoscope}
              accentVar="--forest-700"
              empty={!history?.medicalRecords.length}
              emptyText="Sin registros de consultas"
            >
              {history?.medicalRecords.map((record) => (
                <TimelineItem
                  key={record.id}
                  date={formatDate(record.date)}
                  accentVar="--forest-700"
                >
                  <p className="font-medium" style={{ fontFamily: "var(--font-inter)", fontSize: "14px" }}>
                    {recordTypeLabels[record.type] ?? record.type}
                  </p>
                  {record.diagnosis && (
                    <p className="text-sm" style={{ color: "var(--warm-600)", fontFamily: "var(--font-inter)" }}>
                      Diagnóstico: {record.diagnosis}
                    </p>
                  )}
                  {record.treatment && (
                    <p className="text-sm" style={{ color: "var(--warm-600)", fontFamily: "var(--font-inter)" }}>
                      Tratamiento: {record.treatment}
                    </p>
                  )}
                  {record.notes && (
                    <p className="text-sm" style={{ color: "var(--warm-600)", fontFamily: "var(--font-inter)" }}>
                      Notas: {record.notes}
                    </p>
                  )}
                </TimelineItem>
              ))}
            </TimelineSection>

            {/* Tratamientos */}
            <TimelineSection
              title="Tratamientos"
              Icon={Pill}
              accentVar="--terracotta-500"
              empty={!history?.treatments.length}
              emptyText="Sin tratamientos registrados"
            >
              {history?.treatments.map((t) => (
                <TimelineItem key={t.id} date={formatDate(t.date)} accentVar="--terracotta-500">
                  <p className="font-medium" style={{ fontFamily: "var(--font-inter)", fontSize: "14px" }}>
                    {t.name}
                  </p>
                  <p className="text-sm capitalize" style={{ color: "var(--warm-600)", fontFamily: "var(--font-inter)" }}>
                    {t.type}
                  </p>
                  {t.notes && (
                    <p className="text-sm" style={{ color: "var(--warm-600)", fontFamily: "var(--font-inter)" }}>
                      {t.notes}
                    </p>
                  )}
                </TimelineItem>
              ))}
            </TimelineSection>
          </div>
        </TabsContent>

        {/* --- Tab: Vacunas --- */}
        <TabsContent value="vaccines">
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p
                className="text-sm"
                style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}
              >
                {history?.vaccinations.length ?? 0} vacunas registradas
              </p>
              <button
                type="button"
                onClick={() => setShowVaccineModal(true)}
                className="flex items-center gap-1.5 rounded px-3.5 py-2 text-sm font-medium transition-colors"
                style={{
                  background: "var(--forest-900)",
                  color: "var(--cream-25)",
                  fontFamily: "var(--font-inter)",
                  cursor: "pointer",
                }}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Agregar vacuna
              </button>
            </div>

            {!history?.vaccinations.length ? (
              <div className="card-editorial flex flex-col items-center py-12 text-center">
                <p
                  className="text-xl italic"
                  style={{ fontFamily: "var(--font-fraunces)", color: "var(--warm-600)", fontWeight: 300 }}
                >
                  Sin vacunas registradas
                </p>
                <p
                  className="mt-1 text-sm"
                  style={{ fontFamily: "var(--font-inter)", color: "var(--warm-400)" }}
                >
                  Agrega las vacunas para mantener el historial sanitario actualizado.
                </p>
              </div>
            ) : (
              <div className="card-editorial overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" aria-label="Historial de vacunas">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        {["Vacuna", "Fecha", "Lote", "Próxima dosis", "Estado"].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                            style={{ color: "var(--warm-500, var(--warm-600))", fontFamily: "var(--font-inter)" }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {history.vaccinations.map((v, i) => {
                        const status = vaccineStatus(v.nextDoseDate);
                        return (
                          <tr
                            key={v.id}
                            style={{
                              borderBottom: i < history.vaccinations.length - 1 ? "1px solid var(--border)" : "none",
                            }}
                          >
                            <td
                              className="px-4 py-3 font-medium"
                              style={{ fontFamily: "var(--font-inter)", color: "var(--warm-900)" }}
                            >
                              {v.name}
                            </td>
                            <td
                              className="px-4 py-3"
                              style={{ fontFamily: "var(--font-inter)", color: "var(--warm-700)" }}
                            >
                              {formatDate(v.date)}
                            </td>
                            <td
                              className="px-4 py-3"
                              style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}
                            >
                              {v.batch ?? "—"}
                            </td>
                            <td
                              className="px-4 py-3"
                              style={{ fontFamily: "var(--font-inter)", color: "var(--warm-600)" }}
                            >
                              {v.nextDoseDate ? formatDate(v.nextDoseDate) : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                                style={{
                                  background: status.bg,
                                  color: status.color,
                                  fontFamily: "var(--font-inter)",
                                }}
                              >
                                {status.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* --- Tab: Documentos --- */}
        <TabsContent value="documents">
          <div className="mt-4 space-y-6">
            {/* Drop zone T24 */}
            <PdfDropZone petId={pet.id} onUploaded={fetchData} />

            {/* Lista documentos */}
            {documents.length > 0 && (
              <div className="card-editorial divide-y divide-border">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText
                        className="h-4 w-4 shrink-0"
                        style={{ color: "var(--terracotta-500)" }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p
                          className="truncate text-sm font-medium"
                          style={{ fontFamily: "var(--font-inter)", color: "var(--warm-900)" }}
                        >
                          {doc.name}
                        </p>
                        <p
                          className="text-xs"
                          style={{ fontFamily: "var(--font-inter)", color: "var(--warm-500, var(--warm-600))" }}
                        >
                          {formatDate(doc.createdAt)} · {(doc.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                    <a
                      href={doc.url}
                      download={doc.name}
                      rel="noopener noreferrer"
                      target="_blank"
                      className="flex shrink-0 items-center gap-1 rounded px-2.5 py-1.5 text-xs transition-colors hover:underline"
                      style={{
                        fontFamily: "var(--font-inter)",
                        color: "var(--forest-700)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <Download className="h-3 w-3" aria-hidden="true" />
                      Descargar
                    </a>
                  </div>
                ))}
              </div>
            )}

            {documents.length === 0 && (
              <p
                className="text-center text-sm"
                style={{ fontFamily: "var(--font-inter)", color: "var(--warm-400)" }}
              >
                Ningun documento subido aun.
              </p>
            )}
          </div>
        </TabsContent>

        {/* --- Tab: QR --- */}
        <TabsContent value="qr">
          <div className="card-editorial mt-4 flex flex-col items-center gap-6 py-10">
            <div
              className="rounded p-4"
              style={{ background: "#FFFFFF", border: "1px solid var(--cream-200)" }}
            >
              <QRCodeSVG
                value={`${typeof window !== "undefined" ? window.location.origin : "https://vetconnect-global.netlify.app"}/pet/${pet.uuid}`}
                size={200}
                level="H"
                aria-label={`QR de identificacion de ${pet.name}`}
              />
            </div>
            <div className="text-center">
              <p
                className="font-medium"
                style={{ fontFamily: "var(--font-fraunces)", fontStyle: "italic", color: "var(--warm-900)" }}
              >
                {pet.name}
              </p>
              <p
                className="mt-0.5 text-xs"
                style={{ fontFamily: "var(--font-inter)", color: "var(--warm-400)" }}
              >
                {pet.uuid}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/pet/${pet.uuid}`;
                if (navigator.share) {
                  navigator.share({
                    title: `${pet.name} — VetConnect`,
                    text: `Perfil de ${pet.name} en VetConnect`,
                    url,
                  });
                } else {
                  navigator.clipboard.writeText(url);
                  toast.success("Link copiado al portapapeles");
                }
              }}
              className="flex items-center gap-1.5 rounded px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                border: "1px solid var(--border-strong)",
                color: "var(--warm-700)",
                fontFamily: "var(--font-inter)",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <QrCode className="h-4 w-4" aria-hidden="true" />
              Compartir perfil
            </button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal eliminar */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "var(--font-fraunces)", fontStyle: "italic", fontWeight: 400 }}
            >
              Eliminar mascota
            </DialogTitle>
            <DialogDescription style={{ fontFamily: "var(--font-inter)", fontSize: "13px" }}>
              Estas seguro de que queres eliminar a{" "}
              <strong>{pet.name}</strong>? Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowDelete(false)}
              disabled={deleting}
              className="rounded px-4 py-2 text-sm transition-colors"
              style={{
                border: "1px solid var(--border-strong)",
                background: "transparent",
                color: "var(--warm-700)",
                fontFamily: "var(--font-inter)",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
              style={{
                background: "var(--terracotta-700)",
                color: "#FFFFFF",
                fontFamily: "var(--font-inter)",
                cursor: deleting ? "not-allowed" : "pointer",
              }}
            >
              {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal vacuna T23 */}
      <VaccineModal
        petId={pet.id}
        open={showVaccineModal}
        onClose={() => setShowVaccineModal(false)}
        onAdded={fetchData}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p
        className="text-xs uppercase tracking-wider"
        style={{ fontFamily: "var(--font-inter)", color: "var(--warm-400)" }}
      >
        {label}
      </p>
      <p
        className="mt-0.5 text-sm"
        style={{ fontFamily: "var(--font-inter)", color: value ? "var(--warm-900)" : "var(--warm-400)" }}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}

function TimelineSection({
  title,
  Icon,
  accentVar,
  empty,
  emptyText,
  children,
}: {
  title: string;
  Icon: React.ElementType;
  accentVar: string;
  empty: boolean;
  emptyText: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card-editorial p-6">
      <div
        className="mb-4 flex items-center gap-2 pb-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Icon className="h-4 w-4" style={{ color: `var(${accentVar})` }} aria-hidden="true" />
        <h3
          className="text-base font-medium"
          style={{ fontFamily: "var(--font-fraunces)", color: "var(--warm-900)" }}
        >
          {title}
        </h3>
      </div>
      {empty ? (
        <p
          className="py-4 text-center text-sm"
          style={{ fontFamily: "var(--font-inter)", color: "var(--warm-400)" }}
        >
          {emptyText}
        </p>
      ) : (
        <div className="space-y-5">{children}</div>
      )}
    </div>
  );
}

function TimelineItem({
  date,
  accentVar,
  children,
}: {
  date: string;
  accentVar: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative pl-5"
      style={{ borderLeft: `2px solid var(${accentVar})` }}
    >
      <div
        className="absolute -left-1.5 top-0.5 h-3 w-3 rounded-full"
        style={{ background: `var(${accentVar})` }}
      />
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">{children}</div>
        <span
          className="shrink-0 text-xs"
          style={{ fontFamily: "var(--font-inter)", color: "var(--warm-400)" }}
        >
          {date}
        </span>
      </div>
    </div>
  );
}
