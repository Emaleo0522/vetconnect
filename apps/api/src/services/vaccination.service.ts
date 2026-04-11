import { db } from "../db/client.js";
import { vaccinations, treatments } from "../db/schema/medical.js";
import { pets } from "../db/schema/pets.js";
import { eq, desc, and, lte, gte, sql } from "drizzle-orm";
import type {
  CreateVaccinationInput,
  CreateTreatmentInput,
} from "@vetconnect/shared";

// ---------------------------------------------------------------------------
// createVaccination — owner or linked vet adds a vaccination record
// ---------------------------------------------------------------------------

export async function createVaccination(
  petId: string,
  input: CreateVaccinationInput
) {
  const id = crypto.randomUUID();

  const [vaccination] = await db
    .insert(vaccinations)
    .values({
      id,
      petId,
      name: input.name,
      date: input.date.split("T")[0],
      vetId: input.vetId ?? null,
      batch: input.batch ?? null,
      nextDoseDate: input.nextDoseDate
        ? input.nextDoseDate.split("T")[0]
        : null,
    })
    .returning();

  return vaccination;
}

// ---------------------------------------------------------------------------
// listVaccinations — all vaccinations for a pet, ordered by date desc
// ---------------------------------------------------------------------------

export async function listVaccinations(petId: string) {
  return db
    .select()
    .from(vaccinations)
    .where(eq(vaccinations.petId, petId))
    .orderBy(desc(vaccinations.date));
}

// ---------------------------------------------------------------------------
// getVaccinationById — single vaccination record
// ---------------------------------------------------------------------------

export async function getVaccinationById(id: string) {
  const rows = await db
    .select()
    .from(vaccinations)
    .where(eq(vaccinations.id, id))
    .limit(1);

  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// updateVaccination — update a vaccination record
// ---------------------------------------------------------------------------

export async function updateVaccination(
  id: string,
  input: Partial<CreateVaccinationInput>
) {
  const updateData: Record<string, unknown> = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.date !== undefined) updateData.date = input.date.split("T")[0];
  if (input.vetId !== undefined) updateData.vetId = input.vetId;
  if (input.batch !== undefined) updateData.batch = input.batch;
  if (input.nextDoseDate !== undefined)
    updateData.nextDoseDate = input.nextDoseDate
      ? input.nextDoseDate.split("T")[0]
      : null;

  if (Object.keys(updateData).length === 0) return null;

  const [updated] = await db
    .update(vaccinations)
    .set(updateData)
    .where(eq(vaccinations.id, id))
    .returning();

  return updated ?? null;
}

// ---------------------------------------------------------------------------
// deleteVaccination — hard delete
// ---------------------------------------------------------------------------

export async function deleteVaccination(id: string) {
  const [deleted] = await db
    .delete(vaccinations)
    .where(eq(vaccinations.id, id))
    .returning({ id: vaccinations.id });

  return deleted ?? null;
}

// ---------------------------------------------------------------------------
// getUpcomingVaccinations — vaccinations with nextDoseDate within N days
// ---------------------------------------------------------------------------

export async function getUpcomingVaccinations(withinDays: number = 7) {
  const today = new Date().toISOString().split("T")[0];
  const futureDate = new Date(
    Date.now() + withinDays * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .split("T")[0];

  const rows = await db
    .select({
      vaccination: vaccinations,
      petName: pets.name,
      petId: pets.id,
      ownerId: pets.ownerId,
    })
    .from(vaccinations)
    .innerJoin(pets, eq(vaccinations.petId, pets.id))
    .where(
      and(
        lte(vaccinations.nextDoseDate, futureDate),
        sql`${vaccinations.nextDoseDate} IS NOT NULL`
      )
    );

  // Separate into upcoming and overdue
  return rows.map((row) => ({
    ...row,
    isOverdue: row.vaccination.nextDoseDate! < today,
  }));
}

// ---------------------------------------------------------------------------
// getVaccinationCard — all vaccinations + treatments for shared card
// ---------------------------------------------------------------------------

export async function getVaccinationCard(petId: string) {
  const [pet] = await db
    .select({
      name: pets.name,
      species: pets.species,
      breed: pets.breed,
      sex: pets.sex,
      photo: pets.photo,
      birthDate: pets.birthDate,
    })
    .from(pets)
    .where(eq(pets.id, petId))
    .limit(1);

  if (!pet) return null;

  const [vaccinationRows, treatmentRows] = await Promise.all([
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
    pet,
    vaccinations: vaccinationRows,
    treatments: treatmentRows,
  };
}
