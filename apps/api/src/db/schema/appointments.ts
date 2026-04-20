import {
  pgTable,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./auth.js";
import { pets } from "./pets.js";
import { veterinarianProfiles } from "./profiles.js";
import { appointmentStatusEnum } from "./enums.js";

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export const appointments = pgTable(
  "appointments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    petId: text("pet_id")
      .notNull()
      .references(() => pets.id, { onDelete: "cascade" }),
    vetProfileId: text("vet_profile_id")
      .notNull()
      .references(() => veterinarianProfiles.id, { onDelete: "restrict" }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(30),
    reason: text("reason"),
    notes: text("notes"),
    status: appointmentStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("appointments_user_idx").on(table.userId),
    index("appointments_vet_idx").on(table.vetProfileId),
    index("appointments_scheduled_idx").on(table.scheduledAt),
    index("appointments_status_idx").on(table.status),
  ]
);

// ---------------------------------------------------------------------------
// Vet favorites
// ---------------------------------------------------------------------------

export const favorites = pgTable(
  "favorites",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    vetProfileId: text("vet_profile_id")
      .notNull()
      .references(() => veterinarianProfiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("favorites_user_idx").on(table.userId),
    index("favorites_vet_idx").on(table.vetProfileId),
  ]
);
