import { z } from "zod";

export const treatmentType = [
  "deworming",
  "surgery",
  "therapy",
  "other",
] as const;

export const createVaccinationSchema = z
  .object({
    name: z.string().min(1, { message: "Vaccination name is required" }),
    date: z
      .string()
      .datetime({ message: "date must be a valid ISO date string" }),
    vetId: z.string().uuid().optional(),
    batch: z.string().optional(),
    nextDoseDate: z
      .string()
      .datetime({ message: "nextDoseDate must be a valid ISO date string" })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.nextDoseDate) {
        return new Date(data.nextDoseDate) > new Date(data.date);
      }
      return true;
    },
    {
      message: "nextDoseDate must be after date",
      path: ["nextDoseDate"],
    },
  );

export type CreateVaccinationInput = z.infer<typeof createVaccinationSchema>;

export const createTreatmentSchema = z.object({
  type: z.enum(treatmentType),
  name: z.string().min(1, { message: "Treatment name is required" }),
  date: z
    .string()
    .datetime({ message: "date must be a valid ISO date string" }),
  notes: z.string().optional(),
});

export type CreateTreatmentInput = z.infer<typeof createTreatmentSchema>;
