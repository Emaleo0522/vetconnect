import {
  pgTable,
  text,
  boolean,
  numeric,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./auth.js";

export const veterinarianProfiles = pgTable(
  "veterinarian_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    license: text("license").notNull(),
    specialties: jsonb("specialties").$type<string[]>().default([]),
    clinicName: text("clinic_name"),
    clinicAddress: text("clinic_address"),
    clinicPhone: text("clinic_phone"),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    isEmergency24h: boolean("is_emergency_24h").notNull().default(false),
    bio: text("bio"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("vet_specialties_idx").using("gin", table.specialties),
    index("vet_location_idx").on(table.latitude, table.longitude),
  ]
);

export const organizationProfiles = pgTable("organization_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  orgName: text("org_name").notNull(),
  orgType: text("org_type"),
  address: text("address"),
  website: text("website"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
