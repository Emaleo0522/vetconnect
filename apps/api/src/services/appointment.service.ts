import { db } from "../db/client.js";
import { appointments } from "../db/schema/appointments.js";
import { pets } from "../db/schema/pets.js";
import { veterinarianProfiles } from "../db/schema/profiles.js";
import { veterinarySchedules } from "../db/schema/schedules.js";
import { eq, and, gte, lt, ne, sql, desc, or } from "drizzle-orm";
import { createNotification } from "./notification.service.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateAppointmentInput {
  petId: string;
  vetProfileId: string;
  scheduledAt: Date;
  durationMinutes?: number;
  reason?: string;
  notes?: string;
}

export interface RescheduleInput {
  scheduledAt: Date;
  reason?: string;
}

export class AppointmentError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "AppointmentError";
  }
}

// ---------------------------------------------------------------------------
// listAppointments — paginated by user with status filter
// ---------------------------------------------------------------------------

export async function listAppointments(
  userId: string,
  status?: "upcoming" | "past" | "cancelled",
  page: number = 1,
  limit: number = 20
) {
  const offset = (page - 1) * limit;
  const now = new Date();

  const conditions = [eq(appointments.userId, userId)];

  if (status === "upcoming") {
    conditions.push(
      gte(appointments.scheduledAt, now),
      or(
        eq(appointments.status, "pending"),
        eq(appointments.status, "confirmed")
      )!
    );
  } else if (status === "past") {
    conditions.push(
      or(
        lt(appointments.scheduledAt, now),
        eq(appointments.status, "completed"),
        eq(appointments.status, "no_show")
      )!
    );
  } else if (status === "cancelled") {
    conditions.push(eq(appointments.status, "cancelled"));
  }

  const items = await db
    .select({
      id: appointments.id,
      petId: appointments.petId,
      vetProfileId: appointments.vetProfileId,
      scheduledAt: appointments.scheduledAt,
      durationMinutes: appointments.durationMinutes,
      reason: appointments.reason,
      status: appointments.status,
      createdAt: appointments.createdAt,
      // Pet info
      petName: pets.name,
      petSpecies: pets.species,
      petPhoto: pets.photo,
      // Vet info
      vetClinicName: veterinarianProfiles.clinicName,
      vetClinicPhone: veterinarianProfiles.clinicPhone,
    })
    .from(appointments)
    .leftJoin(pets, eq(appointments.petId, pets.id))
    .leftJoin(
      veterinarianProfiles,
      eq(appointments.vetProfileId, veterinarianProfiles.id)
    )
    .where(and(...conditions))
    .orderBy(desc(appointments.scheduledAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(appointments)
    .where(and(...conditions));

  const total = countResult[0]?.count ?? 0;

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ---------------------------------------------------------------------------
// getAppointmentById — with ownership check data
// ---------------------------------------------------------------------------

export async function getAppointmentById(id: string) {
  const rows = await db
    .select({
      id: appointments.id,
      userId: appointments.userId,
      petId: appointments.petId,
      vetProfileId: appointments.vetProfileId,
      scheduledAt: appointments.scheduledAt,
      durationMinutes: appointments.durationMinutes,
      reason: appointments.reason,
      notes: appointments.notes,
      status: appointments.status,
      createdAt: appointments.createdAt,
      updatedAt: appointments.updatedAt,
      petName: pets.name,
      petSpecies: pets.species,
      petPhoto: pets.photo,
      vetClinicName: veterinarianProfiles.clinicName,
      vetClinicPhone: veterinarianProfiles.clinicPhone,
      vetClinicAddress: veterinarianProfiles.clinicAddress,
    })
    .from(appointments)
    .leftJoin(pets, eq(appointments.petId, pets.id))
    .leftJoin(
      veterinarianProfiles,
      eq(appointments.vetProfileId, veterinarianProfiles.id)
    )
    .where(eq(appointments.id, id))
    .limit(1);

  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// createAppointment — validate slot + no overlap + create
// ---------------------------------------------------------------------------

export async function createAppointment(
  userId: string,
  input: CreateAppointmentInput
) {
  const durationMinutes = input.durationMinutes ?? 30;
  const scheduledAt = input.scheduledAt;
  const endAt = new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000);

  // 1. Verify pet belongs to user
  const pet = await db
    .select({ id: pets.id, name: pets.name })
    .from(pets)
    .where(and(eq(pets.id, input.petId), eq(pets.ownerId, userId)))
    .limit(1);

  if (pet.length === 0) {
    throw new AppointmentError("PET_NOT_FOUND", "Mascota no encontrada o no te pertenece");
  }

  // 2. Verify vet profile exists
  const vetProfile = await db
    .select({ id: veterinarianProfiles.id, userId: veterinarianProfiles.userId })
    .from(veterinarianProfiles)
    .where(eq(veterinarianProfiles.id, input.vetProfileId))
    .limit(1);

  if (vetProfile.length === 0) {
    throw new AppointmentError("VET_NOT_FOUND", "Veterinario no encontrado");
  }

  // 3. Verify day of week and schedule
  // Convertir scheduledAt (UTC) a hora ART (UTC-3) para comparar con el
  // horario del veterinario, que está guardado en hora Argentina.
  const artOffsetMs = -3 * 60 * 60 * 1000; // UTC-3, sin DST
  const scheduledAtART = new Date(scheduledAt.getTime() + artOffsetMs);
  const dayOfWeek = scheduledAtART.getUTCDay(); // usar UTC* sobre fecha desplazada
  const artHH = String(scheduledAtART.getUTCHours()).padStart(2, "0");
  const artMM = String(scheduledAtART.getUTCMinutes()).padStart(2, "0");
  const timeStr = `${artHH}:${artMM}`; // HH:MM en ART

  const schedule = await db
    .select()
    .from(veterinarySchedules)
    .where(
      and(
        eq(veterinarySchedules.vetId, vetProfile[0].userId),
        eq(veterinarySchedules.dayOfWeek, dayOfWeek),
        eq(veterinarySchedules.isActive, true)
      )
    )
    .limit(1);

  if (schedule.length === 0) {
    throw new AppointmentError(
      "OUTSIDE_SCHEDULE",
      "El veterinario no atiende este día"
    );
  }

  const slot = schedule[0];
  if (timeStr < slot.startTime || timeStr >= slot.endTime) {
    throw new AppointmentError(
      "OUTSIDE_HOURS",
      `El veterinario atiende de ${slot.startTime} a ${slot.endTime} este día`
    );
  }

  // 4. Check for slot conflicts at the vet's calendar
  const conflicting = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.vetProfileId, input.vetProfileId),
        ne(appointments.status, "cancelled"),
        // Overlap: existing_start < new_end AND existing_end > new_start
        // Use ISO strings to avoid postgres.js Date serialization issues
        sql`${appointments.scheduledAt} < ${endAt.toISOString()}::timestamptz`,
        sql`${appointments.scheduledAt} + (${appointments.durationMinutes} || ' minutes')::interval > ${scheduledAt.toISOString()}::timestamptz`
      )
    )
    .limit(1);

  if (conflicting.length > 0) {
    throw new AppointmentError("SLOT_TAKEN", "Este horario ya está reservado. Elegí otro.");
  }

  // 5. Create appointment
  const id = crypto.randomUUID();
  const [created] = await db
    .insert(appointments)
    .values({
      id,
      userId,
      petId: input.petId,
      vetProfileId: input.vetProfileId,
      scheduledAt,
      durationMinutes,
      reason: input.reason ?? null,
      notes: input.notes ?? null,
      status: "pending",
    })
    .returning();

  // 6. Create notification
  await createNotification({
    userId,
    type: "appointment",
    title: "Turno agendado",
    body: `Tu turno para ${pet[0].name} fue agendado para el ${scheduledAt.toLocaleDateString("es-AR")}.`,
    data: { appointmentId: id },
    link: `/dashboard/veterinarios/${input.vetProfileId}`,
  });

  return created;
}

// ---------------------------------------------------------------------------
// cancelAppointment — soft delete (status = cancelled)
// ---------------------------------------------------------------------------

export async function cancelAppointment(id: string, userId: string) {
  const appt = await db
    .select({ id: appointments.id, userId: appointments.userId, status: appointments.status })
    .from(appointments)
    .where(eq(appointments.id, id))
    .limit(1);

  if (appt.length === 0) return { error: "NOT_FOUND" };
  if (appt[0].userId !== userId) return { error: "FORBIDDEN" };
  if (appt[0].status === "cancelled") return { error: "ALREADY_CANCELLED" };

  const [updated] = await db
    .update(appointments)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(appointments.id, id))
    .returning();

  return { data: updated };
}

// ---------------------------------------------------------------------------
// rescheduleAppointment
// ---------------------------------------------------------------------------

export async function rescheduleAppointment(
  id: string,
  userId: string,
  input: RescheduleInput
) {
  const appt = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, id))
    .limit(1);

  if (appt.length === 0) return { error: "NOT_FOUND" };
  if (appt[0].userId !== userId) return { error: "FORBIDDEN" };
  if (appt[0].status === "cancelled") return { error: "CANNOT_RESCHEDULE_CANCELLED" };

  const durationMinutes = appt[0].durationMinutes;
  const newEnd = new Date(
    input.scheduledAt.getTime() + durationMinutes * 60 * 1000
  );

  // Check conflicts (exclude self)
  const conflicting = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.vetProfileId, appt[0].vetProfileId),
        ne(appointments.status, "cancelled"),
        ne(appointments.id, id),
        sql`${appointments.scheduledAt} < ${newEnd.toISOString()}::timestamptz`,
        sql`${appointments.scheduledAt} + (${appointments.durationMinutes} || ' minutes')::interval > ${input.scheduledAt.toISOString()}::timestamptz`
      )
    )
    .limit(1);

  if (conflicting.length > 0) {
    return { error: "SLOT_TAKEN" };
  }

  const [updated] = await db
    .update(appointments)
    .set({
      scheduledAt: input.scheduledAt,
      reason: input.reason ?? appt[0].reason,
      updatedAt: new Date(),
    })
    .where(eq(appointments.id, id))
    .returning();

  return { data: updated };
}

// ---------------------------------------------------------------------------
// getAvailableSlots — compute free 30-min slots for a vet on a given date
// ---------------------------------------------------------------------------

export async function getAvailableSlots(vetProfileId: string, date: Date) {
  // Los horarios del veterinario están en hora Argentina (UTC-3, sin DST).
  // Todas las comparaciones de hora y día-de-semana deben hacerse en ART.
  const ART_OFFSET_MS = -3 * 60 * 60 * 1000; // UTC-3

  // Obtener la fecha en ART para calcular el día de semana correcto.
  // `date` llega como midnight UTC del día elegido (ej: "2024-06-01T00:00:00Z").
  // En ART eso corresponde al día anterior a las 21hs → usamos mediodia UTC del
  // día para que caiga correctamente en ART (mediodia UTC = 9am ART = mismo día).
  const dateNoonUTC = new Date(date.getTime() + 12 * 60 * 60 * 1000);
  const dateInART = new Date(dateNoonUTC.getTime() + ART_OFFSET_MS);
  const dayOfWeek = dateInART.getUTCDay(); // día de semana en ART

  // Límites del día en ART expresados en UTC:
  // ART 00:00 = UTC 03:00, ART 23:59:59 = UTC siguiente día 02:59:59
  const [y, m, d] = [
    dateInART.getUTCFullYear(),
    dateInART.getUTCMonth(),
    dateInART.getUTCDate(),
  ];
  // midnight ART del día en UTC
  const dayStartART = new Date(Date.UTC(y, m, d, 3, 0, 0, 0)); // 00:00 ART = 03:00 UTC
  const dayEndART = new Date(Date.UTC(y, m, d + 1, 2, 59, 59, 999)); // 23:59:59 ART = siguiente 02:59:59 UTC

  // Get vet userId
  const vetProfile = await db
    .select({ userId: veterinarianProfiles.userId })
    .from(veterinarianProfiles)
    .where(eq(veterinarianProfiles.id, vetProfileId))
    .limit(1);

  if (vetProfile.length === 0) return null;
  const vetUserId = vetProfile[0].userId;

  // Get schedule for this day
  const scheduleRows = await db
    .select()
    .from(veterinarySchedules)
    .where(
      and(
        eq(veterinarySchedules.vetId, vetUserId),
        eq(veterinarySchedules.dayOfWeek, dayOfWeek),
        eq(veterinarySchedules.isActive, true)
      )
    );

  if (scheduleRows.length === 0) return { slots: [] };

  // Get existing appointments for the vet on this date (en rango ART del día)
  const existing = await db
    .select({
      scheduledAt: appointments.scheduledAt,
      durationMinutes: appointments.durationMinutes,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.vetProfileId, vetProfileId),
        ne(appointments.status, "cancelled"),
        gte(appointments.scheduledAt, dayStartART),
        lt(appointments.scheduledAt, dayEndART)
      )
    );

  // Generate 30-min slots from schedule.
  // El schedule tiene horas ART ("08:00", "18:00").
  // Construimos cada slot como UTC timestamp: hora ART + 3h = UTC.
  const slots: { time: string; available: boolean }[] = [];
  const now = new Date();

  for (const schedSlot of scheduleRows) {
    const [startH, startM] = schedSlot.startTime.split(":").map(Number);
    const [endH, endM] = schedSlot.endTime.split(":").map(Number);

    let cursor = startH * 60 + startM; // minutos desde medianoche ART
    const end = endH * 60 + endM;

    while (cursor + 30 <= end) {
      const artH = Math.floor(cursor / 60);
      const artMin = cursor % 60;

      // Slot start en UTC: día ART 00:00 UTC (03:00) + offset ART de la hora
      const slotStartUTC = new Date(Date.UTC(y, m, d, artH + 3, artMin, 0, 0));
      const slotEndUTC = new Date(slotStartUTC.getTime() + 30 * 60 * 1000);

      // Check overlap con turnos existentes (todos en UTC)
      const isBooked = existing.some((appt) => {
        const apptStart = new Date(appt.scheduledAt);
        const apptEnd = new Date(
          apptStart.getTime() + appt.durationMinutes * 60 * 1000
        );
        return apptStart < slotEndUTC && apptEnd > slotStartUTC;
      });

      const timeStr = `${String(artH).padStart(2, "0")}:${String(artMin).padStart(2, "0")}`;
      slots.push({ time: timeStr, available: !isBooked && slotStartUTC > now });
      cursor += 30;
    }
  }

  return { slots };
}
