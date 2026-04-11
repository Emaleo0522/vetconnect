export {
  registerOwnerSchema,
  registerVetSchema,
  registerOrgSchema,
  loginSchema,
  updateProfileSchema,
} from "./auth.js";
export type {
  RegisterOwnerInput,
  RegisterVetInput,
  RegisterOrgInput,
  LoginInput,
  UpdateProfileInput,
} from "./auth.js";

export {
  petSpecies,
  petSex,
  createPetSchema,
  updatePetSchema,
  linkVetSchema,
} from "./pets.js";
export type {
  CreatePetInput,
  UpdatePetInput,
  LinkVetInput,
} from "./pets.js";

export {
  treatmentType,
  createVaccinationSchema,
  createTreatmentSchema,
} from "./vaccinations.js";
export type {
  CreateVaccinationInput,
  CreateTreatmentInput,
} from "./vaccinations.js";

export {
  createReviewSchema,
  updateReviewSchema,
} from "./reviews.js";
export type {
  CreateReviewInput,
  UpdateReviewInput,
} from "./reviews.js";

export {
  searchVetsSchema,
  updateScheduleSchema,
  toggleEmergencySchema,
} from "./veterinarians.js";
export type {
  SearchVetsInput,
  UpdateScheduleInput,
  ToggleEmergencyInput,
} from "./veterinarians.js";

export {
  medicalRecordType,
  createMedicalRecordSchema,
} from "./medical.js";
export type { CreateMedicalRecordInput } from "./medical.js";
