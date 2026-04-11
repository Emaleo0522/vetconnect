import { db } from "../db/client.js";
import { veterinarySchedules } from "../db/schema/schedules.js";
import { veterinarianProfiles } from "../db/schema/profiles.js";
import { eq, and } from "drizzle-orm";
import type { UpdateScheduleInput, ToggleEmergencyInput } from "@vetconnect/shared";
import { nanoid } from "nanoid";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScheduleSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// getScheduleByVetProfile — public, returns schedule for a vet profile id
// ---------------------------------------------------------------------------

export async function getScheduleByVetProfile(
  vetProfileId: string
): Promise<{ schedule: ScheduleSlot[]; isEmergency24h: boolean } | null> {
  // Resolve vet user id from profile id
  const vetProfile = await db
    .select({
      userId: veterinarianProfiles.userId,
      isEmergency24h: veterinarianProfiles.isEmergency24h,
    })
    .from(veterinarianProfiles)
    .where(eq(veterinarianProfiles.id, vetProfileId))
    .limit(1);

  if (vetProfile.length === 0) return null;

  const vetUserId = vetProfile[0].userId;

  const rows = await db
    .select({
      id: veterinarySchedules.id,
      dayOfWeek: veterinarySchedules.dayOfWeek,
      startTime: veterinarySchedules.startTime,
      endTime: veterinarySchedules.endTime,
      isActive: veterinarySchedules.isActive,
    })
    .from(veterinarySchedules)
    .where(eq(veterinarySchedules.vetId, vetUserId))
    .orderBy(veterinarySchedules.dayOfWeek);

  return {
    schedule: rows,
    isEmergency24h: vetProfile[0].isEmergency24h,
  };
}

// ---------------------------------------------------------------------------
// upsertSchedule — replace all schedule slots for the authenticated vet
// ---------------------------------------------------------------------------

export async function upsertSchedule(
  vetUserId: string,
  slots: UpdateScheduleInput
): Promise<ScheduleSlot[]> {
  // Verify vet profile exists
  const vetProfile = await db
    .select({ id: veterinarianProfiles.id })
    .from(veterinarianProfiles)
    .where(eq(veterinarianProfiles.userId, vetUserId))
    .limit(1);

  if (vetProfile.length === 0) {
    throw new ScheduleError("PROFILE_NOT_FOUND", "Veterinarian profile not found. Complete your profile first.");
  }

  // Delete existing schedule and insert new one (transactional replace)
  await db.delete(veterinarySchedules).where(
    eq(veterinarySchedules.vetId, vetUserId)
  );

  const newSlots = slots.map((slot) => ({
    id: nanoid(),
    vetId: vetUserId,
    dayOfWeek: slot.dayOfWeek,
    startTime: slot.startTime,
    endTime: slot.endTime,
    isActive: slot.isActive,
  }));

  if (newSlots.length > 0) {
    await db.insert(veterinarySchedules).values(newSlots);
  }

  // Return the inserted schedule
  const rows = await db
    .select({
      id: veterinarySchedules.id,
      dayOfWeek: veterinarySchedules.dayOfWeek,
      startTime: veterinarySchedules.startTime,
      endTime: veterinarySchedules.endTime,
      isActive: veterinarySchedules.isActive,
    })
    .from(veterinarySchedules)
    .where(eq(veterinarySchedules.vetId, vetUserId))
    .orderBy(veterinarySchedules.dayOfWeek);

  return rows;
}

// ---------------------------------------------------------------------------
// toggleEmergency — set isEmergency24h on the vet profile
// ---------------------------------------------------------------------------

export async function toggleEmergency(
  vetUserId: string,
  input: ToggleEmergencyInput
): Promise<{ isEmergency24h: boolean }> {
  const result = await db
    .update(veterinarianProfiles)
    .set({
      isEmergency24h: input.isEmergency,
      updatedAt: new Date(),
    })
    .where(eq(veterinarianProfiles.userId, vetUserId))
    .returning({ isEmergency24h: veterinarianProfiles.isEmergency24h });

  if (result.length === 0) {
    throw new ScheduleError("PROFILE_NOT_FOUND", "Veterinarian profile not found");
  }

  return { isEmergency24h: result[0].isEmergency24h };
}

// ---------------------------------------------------------------------------
// ScheduleError
// ---------------------------------------------------------------------------

export class ScheduleError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "ScheduleError";
  }
}
