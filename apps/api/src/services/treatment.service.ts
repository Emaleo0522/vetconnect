import { db } from "../db/client.js";
import { treatments } from "../db/schema/medical.js";
import { eq, desc } from "drizzle-orm";
import type { CreateTreatmentInput } from "@vetconnect/shared";

// ---------------------------------------------------------------------------
// createTreatment — owner or linked vet adds a treatment record
// ---------------------------------------------------------------------------

export async function createTreatment(
  petId: string,
  input: CreateTreatmentInput
) {
  const id = crypto.randomUUID();

  const [treatment] = await db
    .insert(treatments)
    .values({
      id,
      petId,
      type: input.type,
      name: input.name,
      date: input.date.split("T")[0],
      notes: input.notes ?? null,
    })
    .returning();

  return treatment;
}

// ---------------------------------------------------------------------------
// listTreatments — all treatments for a pet, ordered by date desc
// ---------------------------------------------------------------------------

export async function listTreatments(petId: string) {
  return db
    .select()
    .from(treatments)
    .where(eq(treatments.petId, petId))
    .orderBy(desc(treatments.date));
}

// ---------------------------------------------------------------------------
// getTreatmentById — single treatment record
// ---------------------------------------------------------------------------

export async function getTreatmentById(id: string) {
  const rows = await db
    .select()
    .from(treatments)
    .where(eq(treatments.id, id))
    .limit(1);

  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// deleteTreatment — hard delete
// ---------------------------------------------------------------------------

export async function deleteTreatment(id: string) {
  const [deleted] = await db
    .delete(treatments)
    .where(eq(treatments.id, id))
    .returning({ id: treatments.id });

  return deleted ?? null;
}
