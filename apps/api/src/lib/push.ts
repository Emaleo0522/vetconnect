// ---------------------------------------------------------------------------
// Expo Push Notifications wrapper
// https://docs.expo.dev/push-notifications/sending-notifications/
// ---------------------------------------------------------------------------

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const MAX_BATCH_SIZE = 100;

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
}

interface PushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// sendPushNotification — sends a single push notification
// ---------------------------------------------------------------------------

export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<PushTicket> {
  const results = await sendPushNotifications([
    { to: pushToken, title, body, data, sound: "default" },
  ]);
  return results[0];
}

// ---------------------------------------------------------------------------
// sendPushNotifications — batch send (up to 100 per request)
// ---------------------------------------------------------------------------

export async function sendPushNotifications(
  messages: PushMessage[]
): Promise<PushTicket[]> {
  const allTickets: PushTicket[] = [];

  // Split into batches of MAX_BATCH_SIZE
  for (let i = 0; i < messages.length; i += MAX_BATCH_SIZE) {
    const batch = messages.slice(i, i + MAX_BATCH_SIZE);

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        console.error(
          `[PUSH] Expo Push API returned ${response.status}: ${response.statusText}`
        );
        // Add error tickets for this batch
        for (const msg of batch) {
          allTickets.push({
            status: "error",
            message: `HTTP ${response.status}: ${response.statusText}`,
          });
        }
        continue;
      }

      const result = await response.json() as { data: PushTicket[] };
      const tickets = result.data ?? [];

      // Log errors for invalid tokens
      for (const ticket of tickets) {
        if (ticket.status === "error") {
          console.warn(`[PUSH] Error sending notification: ${ticket.message}`, {
            details: ticket.details,
          });
        }
      }

      allTickets.push(...tickets);
    } catch (err) {
      console.error("[PUSH] Failed to send batch:", err);
      // Add error tickets for this batch
      for (const msg of batch) {
        allTickets.push({
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
  }

  return allTickets;
}
