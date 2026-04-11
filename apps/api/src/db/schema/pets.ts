import {
  pgTable,
  text,
  numeric,
  date,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./auth.js";
import { speciesEnum, sexEnum } from "./enums.js";

export const pets = pgTable(
  "pets",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    photo: text("photo"),
    species: speciesEnum("species").notNull(),
    breed: text("breed"),
    birthDate: date("birth_date"),
    sex: sexEnum("sex").notNull(),
    color: text("color"),
    weight: numeric("weight", { precision: 6, scale: 2 }),
    microchip: text("microchip"),
    // Campos que seran cifrados en capa de servicio (T26)
    allergies: text("allergies"),
    medicalConditions: text("medical_conditions"),
    currentMedication: text("current_medication"),
    vetId: text("vet_id").references(() => users.id, {
      onDelete: "set null",
    }),
    uuid: text("uuid").notNull().unique(), // Para QR
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("pets_owner_idx").on(table.ownerId)]
);
