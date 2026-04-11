/** Supported species */
export type Species = "dog" | "cat" | "bird" | "rabbit" | "other";

/** Biological sex */
export type Sex = "male" | "female";

/** Medical record type */
export type MedicalRecordType =
  | "consultation"
  | "treatment"
  | "surgery"
  | "other";

/** Pet record */
export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  photo: string | null;
  species: Species;
  breed: string | null;
  birthDate: string | null;
  sex: Sex;
  color: string | null;
  weight: string | null; // numeric stored as string
  microchip: string | null;
  allergies: string | null;
  medicalConditions: string | null;
  currentMedication: string | null;
  vetId: string | null;
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Medical record for a pet */
export interface MedicalRecord {
  id: string;
  petId: string;
  vetId: string;
  type: MedicalRecordType;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
  date: string;
  createdAt: Date;
}
