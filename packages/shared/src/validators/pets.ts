import { z } from "zod";

export const petSpecies = ["dog", "cat", "bird", "rabbit", "other"] as const;
export const petSex = ["male", "female"] as const;

export const createPetSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Pet name is required" })
    .max(50, { message: "Pet name must be 50 characters or less" }),
  species: z.enum(petSpecies),
  breed: z.string().optional(),
  birthDate: z
    .string()
    .datetime({ message: "birthDate must be a valid ISO date string" }),
  sex: z.enum(petSex),
  color: z.string().optional(),
  weight: z
    .number()
    .positive({ message: "Weight must be a positive number" })
    .optional(),
  microchip: z.string().optional(),
  allergies: z.string().optional(),
  medicalConditions: z.string().optional(),
  currentMedication: z.string().optional(),
});

export type CreatePetInput = z.infer<typeof createPetSchema>;

export const updatePetSchema = createPetSchema.partial();

export type UpdatePetInput = z.infer<typeof updatePetSchema>;

export const linkVetSchema = z.object({
  vetId: z.string().uuid({ message: "vetId must be a valid UUID" }),
});

export type LinkVetInput = z.infer<typeof linkVetSchema>;
