import { getUpcomingVaccinations } from "../services/vaccination.service.js";
import {
  createNotification,
  hasRecentAlert,
  getUserPushTokens,
} from "../services/notification.service.js";
import { sendPushNotifications } from "../lib/push.js";

// ---------------------------------------------------------------------------
// Vaccination alerts job
// Runs periodically to check for upcoming/overdue vaccinations.
// Creates notifications and sends push via Expo Push API.
// ---------------------------------------------------------------------------

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
let intervalHandle: ReturnType<typeof setInterval> | null = null;

// ---------------------------------------------------------------------------
// processVaccinationAlerts — main job logic
// ---------------------------------------------------------------------------

export async function processVaccinationAlerts(): Promise<{
  processed: number;
  notified: number;
  errors: number;
}> {
  console.log("[VACCINATION-ALERTS] Starting vaccination alerts check...");

  let processed = 0;
  let notified = 0;
  let errors = 0;

  try {
    const upcoming = await getUpcomingVaccinations(7);
    processed = upcoming.length;

    interface PushMessage {
      to: string;
      title: string;
      body: string;
      data: Record<string, unknown>;
      sound: "default";
    }

    const pushMessages: PushMessage[] = [];

    for (const row of upcoming) {
      try {
        const { vaccination, petName, ownerId, isOverdue } = row;

        // De-duplication: skip if we already sent an alert for this
        // vaccination to this owner in the last 7 days
        const alreadyAlerted = await hasRecentAlert(
          ownerId,
          vaccination.id,
          7
        );
        if (alreadyAlerted) continue;

        // Build notification content
        const title = isOverdue
          ? `Atencion: vacuna vencida`
          : `Recordatorio de vacuna`;

        const body = isOverdue
          ? `La vacuna ${vaccination.name} de ${petName} esta vencida (${vaccination.nextDoseDate})`
          : `La vacuna ${vaccination.name} de ${petName} vence el ${vaccination.nextDoseDate}`;

        // Save to DB
        await createNotification({
          userId: ownerId,
          type: "vaccine_reminder",
          title,
          body,
          data: {
            vaccinationId: vaccination.id,
            petId: vaccination.petId,
            petName,
            nextDoseDate: vaccination.nextDoseDate,
            isOverdue,
          },
        });

        // Collect push tokens for batch send
        const tokens = await getUserPushTokens(ownerId);
        for (const { token } of tokens) {
          pushMessages.push({
            to: token,
            title,
            body,
            data: {
              type: "vaccine_reminder",
              petId: vaccination.petId,
              vaccinationId: vaccination.id,
            },
            sound: "default",
          });
        }

        notified++;
      } catch (err) {
        errors++;
        console.error(
          `[VACCINATION-ALERTS] Error processing vaccination ${row.vaccination.id}:`,
          err
        );
      }
    }

    // Batch send all push notifications
    if (pushMessages.length > 0) {
      try {
        await sendPushNotifications(pushMessages);
        console.log(
          `[VACCINATION-ALERTS] Sent ${pushMessages.length} push notifications`
        );
      } catch (err) {
        console.error("[VACCINATION-ALERTS] Failed to send push batch:", err);
        errors++;
      }
    }
  } catch (err) {
    console.error("[VACCINATION-ALERTS] Job failed:", err);
    errors++;
  }

  console.log(
    `[VACCINATION-ALERTS] Done. Processed: ${processed}, Notified: ${notified}, Errors: ${errors}`
  );

  return { processed, notified, errors };
}

// ---------------------------------------------------------------------------
// startVaccinationAlerts — starts the periodic job
// ---------------------------------------------------------------------------

export function startVaccinationAlerts(
  intervalMs: number = ONE_DAY_MS
): void {
  if (intervalHandle) {
    console.warn("[VACCINATION-ALERTS] Job already running, skipping start");
    return;
  }

  console.log(
    `[VACCINATION-ALERTS] Scheduling alerts every ${intervalMs / 1000}s`
  );

  // Run once immediately on startup
  processVaccinationAlerts().catch((err) => {
    console.error("[VACCINATION-ALERTS] Initial run failed:", err);
  });

  // Then schedule periodic runs
  intervalHandle = setInterval(() => {
    processVaccinationAlerts().catch((err) => {
      console.error("[VACCINATION-ALERTS] Periodic run failed:", err);
    });
  }, intervalMs);
}

// ---------------------------------------------------------------------------
// stopVaccinationAlerts — stops the periodic job (for graceful shutdown)
// ---------------------------------------------------------------------------

export function stopVaccinationAlerts(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log("[VACCINATION-ALERTS] Job stopped");
  }
}
