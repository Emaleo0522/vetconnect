import { db } from "../db/client.js";
import { pets } from "../db/schema/pets.js";
import { users } from "../db/schema/auth.js";
import { eq, and, sql } from "drizzle-orm";
import type { CreatePetInput, UpdatePetInput } from "@vetconnect/shared";
import { encryptIfPresent, decryptIfPresent } from "../lib/crypto.js";

// ---------------------------------------------------------------------------
// Helpers — decrypt sensitive fields in pet records
// ---------------------------------------------------------------------------

function decryptPetFields<T extends Record<string, unknown>>(pet: T): T {
  return {
    ...pet,
    allergies: decryptIfPresent(pet.allergies as string | null),
    medicalConditions: decryptIfPresent(pet.medicalConditions as string | null),
    currentMedication: decryptIfPresent(pet.currentMedication as string | null),
  };
}

function decryptPetList<T extends Record<string, unknown>>(pets: T[]): T[] {
  return pets.map(decryptPetFields);
}

// ---------------------------------------------------------------------------
// createPet — creates a pet for the authenticated owner
// ---------------------------------------------------------------------------

export async function createPet(ownerId: string, input: CreatePetInput) {
  const id = crypto.randomUUID();
  const uuid = crypto.randomUUID();

  const [pet] = await db
    .insert(pets)
    .values({
      id,
      ownerId,
      uuid,
      name: input.name,
      species: input.species,
      breed: input.breed ?? null,
      birthDate: input.birthDate ? input.birthDate.split("T")[0] : null,
      sex: input.sex,
      color: input.color ?? null,
      weight: input.weight?.toString() ?? null,
      microchip: input.microchip ?? null,
      allergies: encryptIfPresent(input.allergies) ?? null,
      medicalConditions: encryptIfPresent(input.medicalConditions) ?? null,
      currentMedication: encryptIfPresent(input.currentMedication) ?? null,
    })
    .returning();

  return decryptPetFields(pet);
}

// ---------------------------------------------------------------------------
// listPetsByOwner — paginated list of pets for an owner
// ---------------------------------------------------------------------------

export async function listPetsByOwner(
  ownerId: string,
  page: number = 1,
  limit: number = 20
) {
  const offset = (page - 1) * limit;

  const results = await db
    .select()
    .from(pets)
    .where(eq(pets.ownerId, ownerId))
    .orderBy(pets.createdAt)
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pets)
    .where(eq(pets.ownerId, ownerId));

  const total = countResult[0]?.count ?? 0;

  return {
    items: decryptPetList(results),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ---------------------------------------------------------------------------
// getPetById — returns a pet if the requester has access
// ---------------------------------------------------------------------------

export async function getPetById(petId: string) {
  const results = await db
    .select()
    .from(pets)
    .where(eq(pets.id, petId))
    .limit(1);

  const pet = results[0] ?? null;
  return pet ? decryptPetFields(pet) : null;
}

// ---------------------------------------------------------------------------
// updatePet — updates a pet's fields
// ---------------------------------------------------------------------------

export async function updatePet(petId: string, input: UpdatePetInput) {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.species !== undefined) updateData.species = input.species;
  if (input.breed !== undefined) updateData.breed = input.breed;
  if (input.birthDate !== undefined)
    updateData.birthDate = input.birthDate.split("T")[0];
  if (input.sex !== undefined) updateData.sex = input.sex;
  if (input.color !== undefined) updateData.color = input.color;
  if (input.weight !== undefined) updateData.weight = input.weight.toString();
  if (input.microchip !== undefined) updateData.microchip = input.microchip;
  if (input.allergies !== undefined) updateData.allergies = encryptIfPresent(input.allergies);
  if (input.medicalConditions !== undefined)
    updateData.medicalConditions = encryptIfPresent(input.medicalConditions);
  if (input.currentMedication !== undefined)
    updateData.currentMedication = encryptIfPresent(input.currentMedication);

  const [updated] = await db
    .update(pets)
    .set(updateData)
    .where(eq(pets.id, petId))
    .returning();

  return updated ? decryptPetFields(updated) : null;
}

// ---------------------------------------------------------------------------
// deletePet — hard delete a pet
// ---------------------------------------------------------------------------

export async function deletePet(petId: string) {
  const [deleted] = await db
    .delete(pets)
    .where(eq(pets.id, petId))
    .returning({ id: pets.id });

  return deleted ?? null;
}

// ---------------------------------------------------------------------------
// linkVet — set or clear the primary vet for a pet
// ---------------------------------------------------------------------------

export async function linkVet(petId: string, vetId: string | null) {
  // If linking, verify the vet exists and has role 'vet'
  if (vetId) {
    const vetRows = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(and(eq(users.id, vetId), eq(users.role, "vet")))
      .limit(1);

    if (vetRows.length === 0) {
      return { error: "VET_NOT_FOUND" as const };
    }
  }

  const [updated] = await db
    .update(pets)
    .set({ vetId, updatedAt: new Date() })
    .where(eq(pets.id, petId))
    .returning();

  return { data: updated ? decryptPetFields(updated) : null };
}

// ---------------------------------------------------------------------------
// updatePetPhoto — sets the photo field
// ---------------------------------------------------------------------------

export async function updatePetPhoto(
  petId: string,
  photoUrl: string
): Promise<void> {
  await db
    .update(pets)
    .set({ photo: photoUrl, updatedAt: new Date() })
    .where(eq(pets.id, petId));
}

// ---------------------------------------------------------------------------
// getPetByUuid — for QR code lookup (public)
// ---------------------------------------------------------------------------

export async function getPetByUuid(uuid: string) {
  const results = await db
    .select()
    .from(pets)
    .where(eq(pets.uuid, uuid))
    .limit(1);

  const pet = results[0] ?? null;
  return pet ? decryptPetFields(pet) : null;
}
