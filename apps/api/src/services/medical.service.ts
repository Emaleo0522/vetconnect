import { db } from "../db/client.js";
import {
  medicalRecords,
  vaccinations,
  treatments,
} from "../db/schema/medical.js";
import { pets } from "../db/schema/pets.js";
import { users } from "../db/schema/auth.js";
import { eq, desc } from "drizzle-orm";
import type { CreateMedicalRecordInput } from "@vetconnect/shared";
import { encryptIfPresent, decryptIfPresent } from "../lib/crypto.js";

// ---------------------------------------------------------------------------
// Helpers — decrypt sensitive fields in medical records
// ---------------------------------------------------------------------------

function decryptMedicalRecord<T extends Record<string, unknown>>(record: T): T {
  return {
    ...record,
    diagnosis: decryptIfPresent(record.diagnosis as string | null),
    treatment: decryptIfPresent(record.treatment as string | null),
    notes: decryptIfPresent(record.notes as string | null),
  };
}

// ---------------------------------------------------------------------------
// getMedicalHistory — returns all records, vaccinations, treatments for a pet
// ---------------------------------------------------------------------------

export async function getMedicalHistory(petId: string) {
  const [records, vaccinationRows, treatmentRows] = await Promise.all([
    db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.petId, petId))
      .orderBy(desc(medicalRecords.date)),
    db
      .select()
      .from(vaccinations)
      .where(eq(vaccinations.petId, petId))
      .orderBy(desc(vaccinations.date)),
    db
      .select()
      .from(treatments)
      .where(eq(treatments.petId, petId))
      .orderBy(desc(treatments.date)),
  ]);

  return {
    medicalRecords: records.map(decryptMedicalRecord),
    vaccinations: vaccinationRows,
    treatments: treatmentRows,
  };
}

// ---------------------------------------------------------------------------
// createMedicalRecord — vet adds a medical record to a pet
// ---------------------------------------------------------------------------

export async function createMedicalRecord(
  petId: string,
  vetId: string,
  input: CreateMedicalRecordInput
) {
  const id = crypto.randomUUID();

  const [record] = await db
    .insert(medicalRecords)
    .values({
      id,
      petId,
      vetId,
      type: input.type,
      diagnosis: encryptIfPresent(input.diagnosis) ?? null,
      treatment: encryptIfPresent(input.treatment) ?? null,
      notes: encryptIfPresent(input.notes) ?? null,
      date: input.date.split("T")[0],
    })
    .returning();

  return decryptMedicalRecord(record);
}

// ---------------------------------------------------------------------------
// getQrPublicData — public data for QR scan (no sensitive fields)
// ---------------------------------------------------------------------------

export async function getQrPublicData(uuid: string) {
  // Get pet by UUID
  const petRows = await db
    .select()
    .from(pets)
    .where(eq(pets.uuid, uuid))
    .limit(1);

  if (petRows.length === 0) return null;

  const pet = petRows[0];

  // Get active vaccinations (all of them for now)
  const vaccinationRows = await db
    .select({
      name: vaccinations.name,
      date: vaccinations.date,
      nextDoseDate: vaccinations.nextDoseDate,
    })
    .from(vaccinations)
    .where(eq(vaccinations.petId, pet.id))
    .orderBy(desc(vaccinations.date));

  // Get primary vet info if linked
  let vet: { name: string; phone: string | null } | null = null;
  if (pet.vetId) {
    const vetRows = await db
      .select({ name: users.name, phone: users.phone })
      .from(users)
      .where(eq(users.id, pet.vetId))
      .limit(1);

    if (vetRows.length > 0) {
      vet = vetRows[0];
    }
  }

  return {
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    sex: pet.sex,
    color: pet.color,
    photo: pet.photo,
    vaccinations: vaccinationRows,
    primaryVet: vet,
  };
}
