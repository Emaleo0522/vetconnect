import {
  pgTable,
  text,
  integer,
  time,
  boolean,
} from "drizzle-orm/pg-core";
import { users } from "./auth.js";

export const veterinarySchedules = pgTable("veterinary_schedules", {
  id: text("id").primaryKey(),
  vetId: text("vet_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 6=Saturday
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});
