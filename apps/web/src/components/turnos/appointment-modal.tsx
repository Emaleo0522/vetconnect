"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError } from "@/lib/api";
import { X, Calendar, Loader2, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface PetOption {
  id: string;
  name: string;
  species: string;
}

interface PetsResponse {
  items: PetOption[];
}

interface TimeSlot {
  time: string; // "HH:MM"
  available: boolean;
}

interface SlotsResponse {
  date: string;
  slots: TimeSlot[];
}

interface AppointmentModalProps {
  vetId: string;
  vetName: string;
  onClose: () => void;
  onSuccess: (appointmentId: string) => void;
}

function formatDateDisplay(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function getCalendarDays(year: number, month: number): string[] {
  const days: string[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    days.push(`${y}-${m}-${d}`);
    date.setDate(date.getDate() + 1);
  }
  return days;
}

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const DAY_NAMES = ["Lu","Ma","Mi","Ju","Vi","Sa","Do"];

export function AppointmentModal({
  vetId,
  vetName,
  onClose,
  onSuccess,
}: AppointmentModalProps) {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [pets, setPets] = useState<PetOption[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newAppointmentId, setNewAppointmentId] = useState<string | null>(null);

  useEffect(() => {
    async function loadPets() {
      try {
        const data = await api.get<PetsResponse>("/api/pets");
        setPets(data.items ?? []);
        if (data.items.length > 0) setSelectedPetId(data.items[0].id);
      } catch {
        setPets([]);
      }
    }
    loadPets();
  }, []);

  const fetchSlots = useCallback(
    async (date: string) => {
      setSlotsLoading(true);
      setSlots([]);
      setSelectedSlot(null);
      try {
        const data = await api.get<SlotsResponse>(
          `/api/vets/${vetId}/slots?date=${date}`,
        );
        setSlots(data.slots ?? []);
      } catch {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    },
    [vetId],
  );

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate, fetchSlots]);

  async function handleSubmit() {
    if (!selectedDate || !selectedSlot || !selectedPetId) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedSlot}:00`).toISOString();
      const result = await api.post<{ id: string }>("/api/appointments", {
        vetId,
        petId: selectedPetId,
        scheduledAt,
        reason: reason.trim() || null,
      });
      setNewAppointmentId(result.id);
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Error al agendar el turno. Intentá de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Calendar helpers
  const calDays = getCalendarDays(calYear, calMonth);
  const firstDayOfWeek = (new Date(calYear, calMonth, 1).getDay() + 6) % 7; // Mon=0
  const todayStr = today.toISOString().split("T")[0];

  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  }

  const inputStyle = {
    background: "var(--surface)",
    borderColor: "var(--border)",
    color: "var(--warm-900)",
    fontFamily: "var(--font-inter)",
    fontSize: "16px",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-x-4 bottom-0 top-16 z-50 overflow-y-auto rounded-t-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
        style={{
          background: "var(--cream-50)",
          border: "1px solid var(--border)",
          maxWidth: "560px",
          width: "100%",
          maxHeight: "90vh",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h2
              id="modal-title"
              className="text-lg"
              style={{
                fontFamily: "var(--font-fraunces)",
                fontStyle: "italic",
                color: "var(--warm-900)",
                fontWeight: 400,
              }}
            >
              Agendar turno
            </h2>
            <p
              className="text-xs"
              style={{
                fontFamily: "var(--font-inter)",
                color: "var(--warm-500)",
              }}
            >
              con {vetName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            style={{ color: "var(--warm-500)" }}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="flex flex-col items-center gap-4 px-5 py-12 text-center">
            <CheckCircle
              className="h-12 w-12"
              style={{ color: "var(--forest-600)" }}
              aria-hidden="true"
            />
            <h3
              className="text-xl"
              style={{
                fontFamily: "var(--font-fraunces)",
                fontStyle: "italic",
                color: "var(--warm-900)",
                fontWeight: 400,
              }}
            >
              ¡Turno agendado!
            </h3>
            <p
              className="text-sm"
              style={{
                fontFamily: "var(--font-inter)",
                color: "var(--warm-600)",
              }}
            >
              {selectedDate && formatDateDisplay(selectedDate)} a las{" "}
              {selectedSlot}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onSuccess(newAppointmentId ?? "")}
                className="rounded px-5 py-2.5 text-sm font-medium"
                style={{
                  background: "var(--forest-900)",
                  color: "var(--cream-25)",
                  fontFamily: "var(--font-inter)",
                }}
              >
                Ver mis turnos
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded px-5 py-2.5 text-sm"
                style={{
                  border: "1px solid var(--border)",
                  color: "var(--warm-700)",
                  fontFamily: "var(--font-inter)",
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 p-5">
            {/* Step 1: Mascota */}
            <div className="space-y-2">
              <label
                className="label-editorial text-sm"
                htmlFor="appt-pet"
                style={{ fontFamily: "var(--font-inter)", color: "var(--warm-700)" }}
              >
                Mascota *
              </label>
              {pets.length === 0 ? (
                <p
                  className="text-sm"
                  style={{ color: "var(--warm-400)", fontFamily: "var(--font-inter)" }}
                >
                  No tenés mascotas registradas.{" "}
                  <a
                    href="/dashboard/pets/new"
                    className="underline"
                    style={{ color: "var(--forest-600)" }}
                  >
                    Agregar mascota
                  </a>
                </p>
              ) : (
                <select
                  id="appt-pet"
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
            </div>

            {/* Step 2: Calendar */}
            <div className="space-y-2">
              <p
                className="text-sm font-medium"
                style={{ fontFamily: "var(--font-inter)", color: "var(--warm-700)" }}
              >
                Fecha *
              </p>

              <div
                className="rounded-xl p-4"
                style={{
                  background: "var(--cream-25)",
                  border: "1px solid var(--border)",
                }}
              >
                {/* Month nav */}
                <div className="mb-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-cream-100"
                    aria-label="Mes anterior"
                    style={{ color: "var(--warm-600)" }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span
                    className="text-sm font-medium"
                    style={{ fontFamily: "var(--font-inter)", color: "var(--warm-900)" }}
                  >
                    {MONTH_NAMES[calMonth]} {calYear}
                  </span>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="flex h-8 w-8 items-center justify-center rounded transition-colors"
                    aria-label="Mes siguiente"
                    style={{ color: "var(--warm-600)" }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Day headers */}
                <div className="mb-1 grid grid-cols-7 gap-1">
                  {DAY_NAMES.map((d) => (
                    <div
                      key={d}
                      className="py-1 text-center text-xs font-medium"
                      style={{ fontFamily: "var(--font-inter)", color: "var(--warm-400)" }}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Leading empty cells */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {calDays.map((dateStr) => {
                    const isPast = dateStr < todayStr;
                    const isSelected = dateStr === selectedDate;
                    const isToday = dateStr === todayStr;
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        disabled={isPast}
                        onClick={() => setSelectedDate(dateStr)}
                        className="flex h-8 w-full items-center justify-center rounded text-sm transition-colors disabled:opacity-30"
                        style={{
                          background: isSelected
                            ? "var(--forest-900)"
                            : isToday
                              ? "var(--forest-50)"
                              : "transparent",
                          color: isSelected
                            ? "var(--cream-25)"
                            : isToday
                              ? "var(--forest-700)"
                              : "var(--warm-800)",
                          fontFamily: "var(--font-inter)",
                          fontWeight: isToday ? 600 : 400,
                          border: isToday && !isSelected
                            ? "1px solid var(--forest-200)"
                            : "none",
                        }}
                        aria-label={formatDateDisplay(dateStr)}
                        aria-pressed={isSelected}
                      >
                        {parseInt(dateStr.split("-")[2], 10)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 3: Time slots */}
            {selectedDate && (
              <div className="space-y-2">
                <p
                  className="text-sm font-medium"
                  style={{ fontFamily: "var(--font-inter)", color: "var(--warm-700)" }}
                >
                  Horario disponible para{" "}
                  <span style={{ color: "var(--forest-700)" }}>
                    {formatDateDisplay(selectedDate)}
                  </span>
                </p>

                {slotsLoading ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      style={{ color: "var(--warm-400)" }}
                      aria-hidden="true"
                    />
                    <span
                      className="text-sm"
                      style={{ color: "var(--warm-400)", fontFamily: "var(--font-inter)" }}
                    >
                      Cargando horarios...
                    </span>
                  </div>
                ) : slots.length === 0 ? (
                  <p
                    className="py-4 text-center text-sm"
                    style={{ color: "var(--warm-400)", fontFamily: "var(--font-inter)" }}
                  >
                    No hay turnos disponibles para esta fecha
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot.time)}
                        className="rounded px-3 py-1.5 text-sm transition-colors disabled:opacity-30 disabled:line-through"
                        style={{
                          border: `1px solid ${
                            selectedSlot === slot.time
                              ? "var(--forest-900)"
                              : "var(--border)"
                          }`,
                          background:
                            selectedSlot === slot.time
                              ? "var(--forest-900)"
                              : slot.available
                                ? "var(--surface)"
                                : "var(--cream-100)",
                          color:
                            selectedSlot === slot.time
                              ? "var(--cream-25)"
                              : slot.available
                                ? "var(--warm-800)"
                                : "var(--warm-300)",
                          fontFamily: "var(--font-inter)",
                        }}
                        aria-pressed={selectedSlot === slot.time}
                        aria-disabled={!slot.available}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reason */}
            {selectedSlot && (
              <div className="space-y-2">
                <label
                  className="text-sm"
                  htmlFor="appt-reason"
                  style={{ fontFamily: "var(--font-inter)", color: "var(--warm-700)" }}
                >
                  Motivo de la consulta (opcional)
                </label>
                <textarea
                  id="appt-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Control anual, vacunación, revisación general..."
                  rows={3}
                  className="flex w-full resize-none rounded border px-3 py-2.5 text-sm"
                  style={inputStyle}
                />
              </div>
            )}

            {/* Error */}
            {submitError && (
              <p
                className="rounded-lg px-4 py-3 text-sm"
                style={{
                  background: "var(--terracotta-100)",
                  color: "var(--terracotta-700)",
                  fontFamily: "var(--font-inter)",
                  border: "1px solid var(--terracotta-200)",
                }}
                role="alert"
              >
                {submitError}
              </p>
            )}

            {/* Submit */}
            <div
              className="flex gap-3 pt-2"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  !selectedDate ||
                  !selectedSlot ||
                  !selectedPetId
                }
                className="flex flex-1 items-center justify-center gap-2 rounded px-4 py-2.5 text-sm font-medium disabled:opacity-50"
                style={{
                  background: "var(--forest-900)",
                  color: "var(--cream-25)",
                  fontFamily: "var(--font-inter)",
                }}
              >
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                <Calendar className="h-4 w-4" aria-hidden="true" />
                {isSubmitting ? "Agendando..." : "Confirmar turno"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded px-4 py-2.5 text-sm"
                style={{
                  border: "1px solid var(--border)",
                  color: "var(--warm-700)",
                  fontFamily: "var(--font-inter)",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
