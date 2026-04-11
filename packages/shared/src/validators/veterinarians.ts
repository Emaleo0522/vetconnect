import { z } from "zod";

/**
 * Time in HH:mm format (24h).
 */
const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "Time must be in HH:mm format" });

export const searchVetsSchema = z.object({
  specialty: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z
    .number()
    .min(1, { message: "Radius must be at least 1 km" })
    .max(100, { message: "Radius must be at most 100 km" })
    .default(10),
  isEmergency: z.boolean().optional(),
  query: z.string().optional(),
  cursor: z.string().optional(),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(20),
});

export type SearchVetsInput = z.infer<typeof searchVetsSchema>;

const scheduleSlotSchema = z.object({
  dayOfWeek: z
    .number()
    .int()
    .min(0, { message: "dayOfWeek must be 0 (Sunday) to 6 (Saturday)" })
    .max(6),
  startTime: timeSchema,
  endTime: timeSchema,
  isActive: z.boolean(),
});

export const updateScheduleSchema = z
  .array(scheduleSlotSchema)
  .min(1, { message: "At least 1 schedule slot is required" });

export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;

export const toggleEmergencySchema = z.object({
  isEmergency: z.boolean(),
});

export type ToggleEmergencyInput = z.infer<typeof toggleEmergencySchema>;
