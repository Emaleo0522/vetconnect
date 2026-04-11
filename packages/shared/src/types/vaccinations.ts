/** Treatment type */
export type TreatmentType = "deworming" | "surgery" | "therapy" | "other";

/** Vaccination record */
export interface Vaccination {
  id: string;
  petId: string;
  name: string;
  date: string;
  vetId: string | null;
  batch: string | null;
  nextDoseDate: string | null;
  createdAt: Date;
}

/** Treatment record */
export interface Treatment {
  id: string;
  petId: string;
  type: TreatmentType;
  name: string;
  date: string;
  vetId: string | null;
  notes: string | null;
  createdAt: Date;
}
