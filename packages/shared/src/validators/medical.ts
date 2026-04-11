import { z } from "zod";

export const medicalRecordType = [
  "consultation",
  "treatment",
  "surgery",
  "other",
] as const;

export const createMedicalRecordSchema = z.object({
  type: z.enum(medicalRecordType),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
  date: z
    .string()
    .datetime({ message: "date must be a valid ISO date string" }),
});

export type CreateMedicalRecordInput = z.infer<
  typeof createMedicalRecordSchema
>;
