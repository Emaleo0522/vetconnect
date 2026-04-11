import {
  pgTable,
  text,
  date,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./auth.js";
import { pets } from "./pets.js";
import { medicalRecordTypeEnum, treatmentTypeEnum } from "./enums.js";

export const medicalRecords = pgTable("medical_records", {
  id: text("id").primaryKey(),
  petId: text("pet_id")
    .notNull()
    .references(() => pets.id, { onDelete: "cascade" }),
  vetId: text("vet_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  type: medicalRecordTypeEnum("type").notNull(),
  // Campos que seran cifrados en capa de servicio (T26)
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  notes: text("notes"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const vaccinations = pgTable(
  "vaccinations",
  {
    id: text("id").primaryKey(),
    petId: text("pet_id")
      .notNull()
      .references(() => pets.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    date: date("date").notNull(),
    vetId: text("vet_id").references(() => users.id, {
      onDelete: "set null",
    }),
    batch: text("batch"), // lote
    nextDoseDate: date("next_dose_date"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("vaccinations_pet_idx").on(table.petId),
    index("vaccinations_next_dose_idx").on(table.nextDoseDate),
  ]
);

export const treatments = pgTable("treatments", {
  id: text("id").primaryKey(),
  petId: text("pet_id")
    .notNull()
    .references(() => pets.id, { onDelete: "cascade" }),
  type: treatmentTypeEnum("type").notNull(),
  name: text("name").notNull(),
  date: date("date").notNull(),
  vetId: text("vet_id").references(() => users.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
