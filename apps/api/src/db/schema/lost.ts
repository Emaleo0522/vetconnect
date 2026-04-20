import {
  pgTable,
  text,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./auth.js";
import { pets } from "./pets.js";
import { lostReportStatusEnum, contactPreferenceEnum } from "./enums.js";

// ---------------------------------------------------------------------------
// Lost reports
// ---------------------------------------------------------------------------

export const lostReports = pgTable(
  "lost_reports",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    petId: text("pet_id")
      .notNull()
      .references(() => pets.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
    // Jittered coordinates (server applies ±200-500m jitter)
    lastSeenLat: numeric("last_seen_lat", { precision: 10, scale: 7 }).notNull(),
    lastSeenLng: numeric("last_seen_lng", { precision: 10, scale: 7 }).notNull(),
    status: lostReportStatusEnum("status").notNull().default("active"),
    contactPreference: contactPreferenceEnum("contact_preference")
      .notNull()
      .default("app"),
    reward: text("reward"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("lost_reports_owner_idx").on(table.ownerId),
    index("lost_reports_status_idx").on(table.status),
    index("lost_reports_created_idx").on(table.createdAt),
  ]
);

// ---------------------------------------------------------------------------
// Sightings (avistamientos)
// ---------------------------------------------------------------------------

export const sightings = pgTable(
  "sightings",
  {
    id: text("id").primaryKey(),
    lostReportId: text("lost_report_id")
      .notNull()
      .references(() => lostReports.id, { onDelete: "cascade" }),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
    lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
    photoUrl: text("photo_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("sightings_report_idx").on(table.lostReportId),
  ]
);
