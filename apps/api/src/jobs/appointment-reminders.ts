import { db } from "../db/client.js";
import { appointments } from "../db/schema/appointments.js";
import { pets } from "../db/schema/pets.js";
import { veterinarianProfiles } from "../db/schema/profiles.js";
import { eq, and, gte, lt, or, sql } from "drizzle-orm";
import { createNotification } from "../services/notification.service.js";

// ---------------------------------------------------------------------------
// Appointment reminder job
// Runs every hour. Sends notifications:
// - 24h before appointment (±30 min window to avoid double-send)
// - 1h before appointment (±30 min window to avoid double-send)
// ---------------------------------------------------------------------------

const REMINDER_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export function startAppointmentReminders() {
  console.log("[appointment-reminders] Starting appointment reminder job...");

  // Run immediately, then every hour
  runReminders().catch((err) =>
    console.error("[appointment-reminders] Error on startup:", err)
  );

  setInterval(() => {
    runReminders().catch((err) =>
      console.error("[appointment-reminders] Error in interval:", err)
    );
  }, REMINDER_INTERVAL_MS);
}

async function runReminders() {
  const now = new Date();

  // Window: now + 23h30m to now + 24h30m (24h reminder)
  const window24hStart = new Date(now.getTime() + 23.5 * 60 * 60 * 1000);
  const window24hEnd = new Date(now.getTime() + 24.5 * 60 * 60 * 1000);

  // Window: now + 30m to now + 90m (1h reminder)
  const window1hStart = new Date(now.getTime() + 30 * 60 * 1000);
  const window1hEnd = new Date(now.getTime() + 90 * 60 * 1000);

  // Fetch appointments in either window
  const upcoming = await db
    .select({
      id: appointments.id,
      userId: appointments.userId,
      scheduledAt: appointments.scheduledAt,
      reason: appointments.reason,
      vetProfileId: appointments.vetProfileId,
      petId: appointments.petId,
      petName: pets.name,
      clinicName: veterinarianProfiles.clinicName,
    })
    .from(appointments)
    .leftJoin(pets, eq(appointments.petId, pets.id))
    .leftJoin(
      veterinarianProfiles,
      eq(appointments.vetProfileId, veterinarianProfiles.id)
    )
    .where(
      and(
        or(
          eq(appointments.status, "pending"),
          eq(appointments.status, "confirmed")
        ),
        or(
          and(
            gte(appointments.scheduledAt, window24hStart),
            lt(appointments.scheduledAt, window24hEnd)
          ),
          and(
            gte(appointments.scheduledAt, window1hStart),
            lt(appointments.scheduledAt, window1hEnd)
          )
        )
      )
    );

  let sent = 0;

  for (const appt of upcoming) {
    const msUntil = new Date(appt.scheduledAt).getTime() - now.getTime();
    const hoursUntil = msUntil / (60 * 60 * 1000);

    const is24h = hoursUntil >= 23 && hoursUntil <= 25;
    const is1h = hoursUntil >= 0.5 && hoursUntil <= 1.5;

    if (!is24h && !is1h) continue;

    const timeLabel = is24h ? "mañana" : "en 1 hora";
    const localTime = new Date(appt.scheduledAt).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const clinicLabel = appt.clinicName ?? "tu veterinario";
    const petLabel = appt.petName ?? "tu mascota";

    // Avoid duplicate notifications using the appointment ID + type in data
    // The notification service's hasRecentAlert pattern would need extending.
    // For MVP, we rely on the window math to avoid double-sends naturally.

    await createNotification({
      userId: appt.userId,
      type: "appointment",
      title: `Recordatorio de turno`,
      body: `Tu turno para ${petLabel} en ${clinicLabel} es ${timeLabel} a las ${localTime}.`,
      data: {
        appointmentId: appt.id,
        reminderType: is24h ? "24h" : "1h",
      },
      link: `/dashboard/turnos`,
    });

    sent++;
  }

  if (sent > 0) {
    console.log(
      `[appointment-reminders] Sent ${sent} reminder notification(s) at ${now.toISOString()}`
    );
  }
}
