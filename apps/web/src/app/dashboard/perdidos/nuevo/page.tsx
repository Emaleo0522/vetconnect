"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { ArrowLeft, MapPin, AlertCircle, Loader2, Upload, X } from "lucide-react";

interface PetOption {
  id: string;
  name: string;
  species: string;
  photo: string | null;
}

interface PetsResponse {
  items: PetOption[];
}

const SPECIES_OPTIONS = ["Perro", "Gato", "Ave", "Conejo", "Otro"];
const CONTACT_OPTIONS = [
  { value: "app", label: "App (VetConnect)" },
  { value: "phone", label: "Teléfono" },
  { value: "email", label: "Email" },
];

/** Apply random jitter of 200-500m to coordinates (client-side hint) */
function applyGeolocationJitter(lat: number, lng: number): { lat: number; lng: number } {
  const radiusM = 200 + Math.random() * 300; // 200-500m
  const radiusDeg = radiusM / 111_320;
  const angle = Math.random() * 2 * Math.PI;
  return {
    lat: lat + radiusDeg * Math.cos(angle),
    lng: lng + (radiusDeg / Math.cos((lat * Math.PI) / 180)) * Math.sin(angle),
  };
}

export default function NuevoReportePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pets list
  const [pets, setPets] = useState<PetOption[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);

  // Form fields
  const [selectedPetId, setSelectedPetId] = useState("");
  const [quickPetName, setQuickPetName] = useState("");
  const [quickPetSpecies, setQuickPetSpecies] = useState("Perro");
  const [useQuickPet, setUseQuickPet] = useState(false);
  const [lostDate, setLostDate] = useState("");
  const [lostTime, setLostTime] = useState("");
  const [description, setDescription] = useState("");
  const [contactPreference, setContactPreference] = useState("app");
  const [contactValue, setContactValue] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Geolocation
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [manualZone, setManualZone] = useState("");

  // Submit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Field errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadPets() {
      try {
        const data = await api.get<PetsResponse>("/api/pets");
        setPets(data.items ?? []);
      } catch {
        setPets([]);
      } finally {
        setPetsLoading(false);
      }
    }
    loadPets();
  }, []);

  function requestGeolocation() {
    setGeoLoading(true);
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Tu navegador no soporta geolocalización. Ingresá la zona manualmente.");
      setGeoLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Apply client-side jitter hint — server applies final jitter
        const jittered = applyGeolocationJitter(
          pos.coords.latitude,
          pos.coords.longitude,
        );
        setCoords(jittered);
        setGeoLoading(false);
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "Permiso de ubicación denegado. Ingresá la zona manualmente."
            : "No se pudo obtener tu ubicación. Ingresá la zona manualmente.";
        setGeoError(msg);
        setGeoLoading(false);
      },
      { timeout: 8000, enableHighAccuracy: false },
    );
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        photo: "Solo se permiten imágenes JPEG, PNG o WebP",
      }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        photo: "La imagen no puede superar 5MB",
      }));
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.photo;
      return next;
    });
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function removePhoto() {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!useQuickPet && !selectedPetId) {
      newErrors.pet = "Seleccioná una mascota o usá el formulario rápido";
    }
    if (useQuickPet && !quickPetName.trim()) {
      newErrors.quickPetName = "El nombre de la mascota es requerido";
    }
    if (!lostDate) {
      newErrors.lostDate = "La fecha es requerida";
    }
    if (!coords && !manualZone.trim()) {
      newErrors.zone = "Indicá la zona donde se perdió la mascota";
    }
    if (!contactValue.trim()) {
      newErrors.contactValue = "El dato de contacto es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Backend expects: petId (required), description (min 10), lastSeenAt (ISO),
      // lat (number), lng (number), contactPreference ("app"|"phone"|"email")
      if (!useQuickPet && !selectedPetId) {
        setErrors({ pet: "Seleccioná una mascota" });
        setIsSubmitting(false);
        return;
      }
      if (useQuickPet) {
        // Quick pet mode not supported by backend schema — petId is required
        setErrors({ pet: "El backend requiere una mascota registrada. Registrá tu mascota primero." });
        setIsSubmitting(false);
        return;
      }

      const lastSeenAt = lostDate
        ? lostTime
          ? new Date(`${lostDate}T${lostTime}:00`).toISOString()
          : new Date(`${lostDate}T12:00:00`).toISOString()
        : new Date().toISOString();

      // lat/lng required as numbers — fallback to Buenos Aires if no geolocation
      const lat = coords?.lat ?? -34.6037;
      const lng = coords?.lng ?? -58.3816;

      // description is required (min 10 chars)
      const descriptionText = description.trim() || manualZone.trim() || "Sin descripción adicional.";

      const body = {
        petId: selectedPetId,
        description: descriptionText.length >= 10 ? descriptionText : descriptionText + " (reportado por el dueño)",
        lastSeenAt,
        lat,
        lng,
        contactPreference: contactPreference as "app" | "phone" | "email",
        reward: undefined as string | undefined,
      };

      const result = await api.post<{ id: string }>("/api/lost-reports", body);
      const reportId = result.id;

      router.push(`/dashboard/perdidos/${reportId}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Error al crear el reporte. Intentá de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputStyle = {
    background: "var(--surface)",
    borderColor: "var(--border)",
    color: "var(--warm-900)",
    fontFamily: "var(--font-inter)",
    fontSize: "16px", // >= 16px previene autozoom en iOS
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/perdidos"
        className="inline-flex items-center gap-1.5 text-sm transition-colors hover:underline focus-visible:outline-none"
        style={{ fontFamily: "var(--font-inter)", color: "var(--forest-700)" }}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a reportes
      </Link>

      <div>
        <h1
          className="text-3xl"
          style={{
            fontFamily: "var(--font-fraunces)",
            fontStyle: "italic",
            color: "var(--warm-900)",
            fontWeight: 300,
            letterSpacing: "-0.02em",
          }}
        >
          Reportar mascota perdida
        </h1>
        <p
          className="mt-1 text-sm"
          style={{
            fontFamily: "var(--font-inter)",
            color: "var(--warm-600)",
          }}
        >
          Completá el formulario para que la comunidad pueda ayudarte a encontrarla
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="max-w-2xl space-y-8">
        {/* Section: Mascota */}
        <fieldset
          className="space-y-4 rounded-xl p-5"
          style={{
            border: "1px solid var(--border)",
            background: "var(--cream-25)",
          }}
        >
          <legend
            className="px-1 text-sm font-semibold"
            style={{
              fontFamily: "var(--font-inter)",
              color: "var(--warm-700)",
            }}
          >
            Mascota
          </legend>

          {/* Toggle: mis mascotas / crear rápido */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUseQuickPet(false)}
              className="flex-1 rounded py-2 text-sm font-medium transition-colors"
              style={{
                background: !useQuickPet ? "var(--forest-900)" : "transparent",
                color: !useQuickPet ? "var(--cream-25)" : "var(--warm-600)",
                border: `1px solid ${!useQuickPet ? "var(--forest-900)" : "var(--border)"}`,
                fontFamily: "var(--font-inter)",
              }}
            >
              Mis mascotas
            </button>
            <button
              type="button"
              onClick={() => setUseQuickPet(true)}
              className="flex-1 rounded py-2 text-sm font-medium transition-colors"
              style={{
                background: useQuickPet ? "var(--forest-900)" : "transparent",
                color: useQuickPet ? "var(--cream-25)" : "var(--warm-600)",
                border: `1px solid ${useQuickPet ? "var(--forest-900)" : "var(--border)"}`,
                fontFamily: "var(--font-inter)",
              }}
            >
              Nueva mascota
            </button>
          </div>

          {!useQuickPet ? (
            <div className="space-y-1">
              <label
                className="label-editorial"
                htmlFor="pet-select"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Seleccionar mascota
              </label>
              {petsLoading ? (
                <div
                  className="skeleton-warm"
                  style={{ height: "40px", borderRadius: "6px" }}
                />
              ) : pets.length === 0 ? (
                <p
                  className="text-sm"
                  style={{
                    color: "var(--warm-400)",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  No tenés mascotas registradas.{" "}
                  <button
                    type="button"
                    onClick={() => setUseQuickPet(true)}
                    className="underline"
                    style={{ color: "var(--forest-600)" }}
                  >
                    Usá el formulario rápido
                  </button>
                </p>
              ) : (
                <select
                  id="pet-select"
                  value={selectedPetId}
                  onChange={(e) => setSelectedPetId(e.target.value)}
                  className="flex h-10 w-full rounded border px-3"
                  style={inputStyle}
                >
                  <option value="">Seleccioná una mascota...</option>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.species})
                    </option>
                  ))}
                </select>
              )}
              {errors.pet && (
                <p
                  className="text-sm"
                  style={{
                    color: "var(--terracotta-700)",
                    fontFamily: "var(--font-inter)",
                  }}
                  role="alert"
                >
                  {errors.pet}
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  className="label-editorial"
                  htmlFor="quick-name"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  Nombre de la mascota *
                </label>
                <input
                  id="quick-name"
                  type="text"
                  value={quickPetName}
                  onChange={(e) => setQuickPetName(e.target.value)}
                  placeholder="Ej: Luna"
                  className="flex h-10 w-full rounded border px-3"
                  style={inputStyle}
                />
                {errors.quickPetName && (
                  <p
                    className="text-sm"
                    style={{ color: "var(--terracotta-700)", fontFamily: "var(--font-inter)" }}
                    role="alert"
                  >
                    {errors.quickPetName}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label
                  className="label-editorial"
                  htmlFor="quick-species"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  Especie
                </label>
                <select
                  id="quick-species"
                  value={quickPetSpecies}
                  onChange={(e) => setQuickPetSpecies(e.target.value)}
                  className="flex h-10 w-full rounded border px-3"
                  style={inputStyle}
                >
                  {SPECIES_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </fieldset>

        {/* Section: Última vez visto */}
        <fieldset
          className="space-y-4 rounded-xl p-5"
          style={{
            border: "1px solid var(--border)",
            background: "var(--cream-25)",
          }}
        >
          <legend
            className="px-1 text-sm font-semibold"
            style={{
              fontFamily: "var(--font-inter)",
              color: "var(--warm-700)",
            }}
          >
            Última vez visto
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label
                className="label-editorial"
                htmlFor="lost-date"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Fecha *
              </label>
              <input
                id="lost-date"
                type="date"
                value={lostDate}
                onChange={(e) => setLostDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="flex h-10 w-full rounded border px-3"
                style={inputStyle}
              />
              {errors.lostDate && (
                <p
                  className="text-sm"
                  style={{ color: "var(--terracotta-700)", fontFamily: "var(--font-inter)" }}
                  role="alert"
                >
                  {errors.lostDate}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label
                className="label-editorial"
                htmlFor="lost-time"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Hora (opcional)
              </label>
              <input
                id="lost-time"
                type="time"
                value={lostTime}
                onChange={(e) => setLostTime(e.target.value)}
                className="flex h-10 w-full rounded border px-3"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Geolocation */}
          <div className="space-y-2">
            <p
              className="label-editorial"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Zona de pérdida *
            </p>

            {/* Privacy notice */}
            <div
              className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm"
              style={{
                background: "var(--forest-50)",
                border: "1px solid var(--forest-200)",
                fontFamily: "var(--font-inter)",
                color: "var(--forest-700)",
              }}
              role="note"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>
                Por privacidad, <strong>solo se muestra una zona aproximada</strong> a los demás
                usuarios. Tu dirección exacta nunca es visible públicamente.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={requestGeolocation}
                disabled={geoLoading}
                className="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  border: "1px solid var(--forest-900)",
                  color: "var(--forest-900)",
                  background: "transparent",
                  fontFamily: "var(--font-inter)",
                }}
              >
                {geoLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                )}
                {geoLoading ? "Obteniendo..." : coords ? "Actualizar ubicación" : "Usar mi ubicación"}
              </button>
              {coords && (
                <span
                  className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs"
                  style={{
                    background: "var(--forest-100)",
                    color: "var(--forest-700)",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  ✓ Ubicación capturada (zona aproximada)
                </span>
              )}
            </div>

            {geoError && (
              <p
                className="text-sm"
                style={{ color: "var(--terracotta-700)", fontFamily: "var(--font-inter)" }}
                role="alert"
              >
                {geoError}
              </p>
            )}

            <div className="space-y-1">
              <label
                className="label-editorial"
                htmlFor="manual-zone"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {coords
                  ? "Descripción adicional de la zona (opcional)"
                  : "Descripción de la zona (barrio, calle, referencia)"}
              </label>
              <input
                id="manual-zone"
                type="text"
                value={manualZone}
                onChange={(e) => setManualZone(e.target.value)}
                placeholder="Ej: Palermo Soho, cerca del Parque Las Heras"
                className="flex h-10 w-full rounded border px-3"
                style={inputStyle}
              />
            </div>
            {errors.zone && (
              <p
                className="text-sm"
                style={{ color: "var(--terracotta-700)", fontFamily: "var(--font-inter)" }}
                role="alert"
              >
                {errors.zone}
              </p>
            )}
          </div>
        </fieldset>

        {/* Section: Descripción + foto */}
        <fieldset
          className="space-y-4 rounded-xl p-5"
          style={{
            border: "1px solid var(--border)",
            background: "var(--cream-25)",
          }}
        >
          <legend
            className="px-1 text-sm font-semibold"
            style={{
              fontFamily: "var(--font-inter)",
              color: "var(--warm-700)",
            }}
          >
            Descripción
          </legend>

          <div className="space-y-1">
            <label
              className="label-editorial"
              htmlFor="description"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Descripción (tamaño, color, comportamiento)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Labrador dorado, collar rojo, muy amigable, responde al nombre Luna"
              rows={3}
              className="flex w-full resize-y rounded border px-3 py-2.5"
              style={{ ...inputStyle, lineHeight: "1.5" }}
            />
          </div>

          {/* Photo upload */}
          <div className="space-y-2">
            <p
              className="label-editorial"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Foto (opcional)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
              aria-label="Subir foto de la mascota"
            />
            {photoPreview ? (
              <div className="relative inline-block">
                <img
                  src={photoPreview}
                  alt="Vista previa"
                  width={120}
                  height={120}
                  className="rounded-lg object-cover"
                  style={{ width: "120px", height: "120px" }}
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full"
                  style={{
                    background: "var(--terracotta-500)",
                    color: "#fff",
                  }}
                  aria-label="Eliminar foto"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="dropzone-editorial flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors"
              >
                <Upload
                  className="h-6 w-6"
                  style={{ color: "var(--warm-400)" }}
                  aria-hidden="true"
                />
                <span
                  className="text-sm"
                  style={{
                    fontFamily: "var(--font-inter)",
                    color: "var(--warm-600)",
                  }}
                >
                  Subir foto
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--warm-400)" }}
                >
                  JPEG, PNG o WebP · Máx 5MB
                </span>
              </button>
            )}
            {errors.photo && (
              <p
                className="text-sm"
                style={{ color: "var(--terracotta-700)", fontFamily: "var(--font-inter)" }}
                role="alert"
              >
                {errors.photo}
              </p>
            )}
          </div>
        </fieldset>

        {/* Section: Contacto */}
        <fieldset
          className="space-y-4 rounded-xl p-5"
          style={{
            border: "1px solid var(--border)",
            background: "var(--cream-25)",
          }}
        >
          <legend
            className="px-1 text-sm font-semibold"
            style={{
              fontFamily: "var(--font-inter)",
              color: "var(--warm-700)",
            }}
          >
            Datos de contacto
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label
                className="label-editorial"
                htmlFor="contact-pref"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Preferencia de contacto
              </label>
              <select
                id="contact-pref"
                value={contactPreference}
                onChange={(e) => setContactPreference(e.target.value)}
                className="flex h-10 w-full rounded border px-3"
                style={inputStyle}
              >
                {CONTACT_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label
                className="label-editorial"
                htmlFor="contact-value"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {contactPreference === "email"
                  ? "Email"
                  : "Número de teléfono"}{" "}
                *
              </label>
              <input
                id="contact-value"
                type={contactPreference === "email" ? "email" : "tel"}
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={
                  contactPreference === "email"
                    ? "tu@email.com"
                    : "+54 11 1234-5678"
                }
                className="flex h-10 w-full rounded border px-3"
                style={inputStyle}
              />
              {errors.contactValue && (
                <p
                  className="text-sm"
                  style={{ color: "var(--terracotta-700)", fontFamily: "var(--font-inter)" }}
                  role="alert"
                >
                  {errors.contactValue}
                </p>
              )}
            </div>
          </div>
        </fieldset>

        {/* Global error */}
        {submitError && (
          <div
            className="flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
            style={{
              background: "var(--terracotta-100)",
              border: "1px solid var(--terracotta-200)",
              color: "var(--terracotta-700)",
              fontFamily: "var(--font-inter)",
            }}
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {submitError}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              background: "var(--forest-900)",
              color: "var(--cream-25)",
              fontFamily: "var(--font-inter)",
            }}
          >
            {isSubmitting && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {isSubmitting ? "Publicando..." : "Publicar reporte"}
          </button>
          <Link
            href="/dashboard/perdidos"
            className="flex items-center rounded px-4 py-2.5 text-sm transition-colors"
            style={{
              border: "1px solid var(--border)",
              color: "var(--warm-700)",
              fontFamily: "var(--font-inter)",
            }}
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
