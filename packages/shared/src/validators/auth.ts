import { z } from "zod";

/**
 * Password must be at least 8 characters, contain 1 uppercase letter and 1 number.
 */
const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .regex(/[A-Z]/, { message: "Password must contain at least 1 uppercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least 1 number" });

/**
 * Argentine veterinary license format: 2 letters + 4-6 digits (e.g. MP1234, MN123456).
 */
const argentineLicenseSchema = z
  .string()
  .regex(/^[A-Za-z]{2}\d{4,6}$/, {
    message: "License must be 2 letters followed by 4-6 digits (e.g. MP1234)",
  });

// ---------------------------------------------------------------------------
// Register schemas
// ---------------------------------------------------------------------------

export const registerOwnerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email format" }),
  password: passwordSchema,
  phone: z.string().optional(),
});

export type RegisterOwnerInput = z.infer<typeof registerOwnerSchema>;

export const registerVetSchema = registerOwnerSchema.extend({
  license: argentineLicenseSchema,
  specialties: z
    .array(z.string())
    .min(1, { message: "At least 1 specialty is required" }),
  clinicName: z.string().min(1, { message: "Clinic name is required" }),
  clinicAddress: z.string().min(1, { message: "Clinic address is required" }),
  clinicPhone: z.string().min(1, { message: "Clinic phone is required" }),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type RegisterVetInput = z.infer<typeof registerVetSchema>;

export const registerOrgSchema = registerOwnerSchema.extend({
  orgName: z.string().min(1, { message: "Organization name is required" }),
  orgType: z.enum(["shelter", "rescue", "foundation", "other"]),
  address: z.string().min(1, { message: "Address is required" }),
  website: z.string().url({ message: "Invalid URL" }).optional(),
});

export type RegisterOrgInput = z.infer<typeof registerOrgSchema>;

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Update profile (partial — only editable fields)
// ---------------------------------------------------------------------------

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  // Vet-specific (ignored for non-vet roles at the API layer)
  license: z.string().regex(/^[A-Za-z]{2}\d{4,6}$/, {
    message: "License must be 2 letters followed by 4-6 digits (e.g. MP1234)",
  }).optional(),
  specialties: z.array(z.string()).min(1).optional(),
  clinicName: z.string().min(1).optional(),
  clinicAddress: z.string().min(1).optional(),
  clinicPhone: z.string().min(1).optional(),
  is24h: z.boolean().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  // Org-specific
  orgName: z.string().min(1).optional(),
  orgType: z.enum(["shelter", "rescue", "foundation", "other"]).optional(),
  address: z.string().min(1).optional(),
  website: z.string().url().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
