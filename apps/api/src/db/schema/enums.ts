import { pgEnum } from "drizzle-orm/pg-core";

// === Auth & User ===
export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "vet",
  "org",
  "admin",
]);

// === Pets ===
export const speciesEnum = pgEnum("species", [
  "dog",
  "cat",
  "bird",
  "rabbit",
  "other",
]);

export const sexEnum = pgEnum("sex", ["male", "female"]);

// === Medical ===
export const medicalRecordTypeEnum = pgEnum("medical_record_type", [
  "consultation",
  "treatment",
  "surgery",
  "other",
]);

export const treatmentTypeEnum = pgEnum("treatment_type", [
  "deworming",
  "surgery",
  "therapy",
  "other",
]);

// === Notifications ===
export const notificationTypeEnum = pgEnum("notification_type", [
  "vaccine_reminder",
  "appointment",
  "lost_pet",
  "sighting",
  "community",
  "general",
]);

export const platformEnum = pgEnum("platform", ["ios", "android"]);

// === Appointments ===
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);

// === Lost reports ===
export const lostReportStatusEnum = pgEnum("lost_report_status", [
  "active",
  "found",
  "closed",
]);

export const contactPreferenceEnum = pgEnum("contact_preference", [
  "app",
  "phone",
  "email",
]);

// === Community ===
export const postVisibilityEnum = pgEnum("post_visibility", [
  "public",
  "followers",
]);

export const postReportReasonEnum = pgEnum("post_report_reason", [
  "spam",
  "inappropriate",
  "other",
]);
