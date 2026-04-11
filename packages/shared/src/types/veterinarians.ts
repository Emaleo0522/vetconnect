/** Veterinarian profile */
export interface VetProfile {
  id: string;
  userId: string;
  license: string;
  specialties: string[];
  clinicName: string | null;
  clinicAddress: string | null;
  clinicPhone: string | null;
  latitude: string | null;
  longitude: string | null;
  isEmergency24h: boolean;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Weekly schedule entry */
export interface VetSchedule {
  id: string;
  vetId: string;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  startTime: string;
  endTime: string;
  isActive: boolean;
}

/** Review of a veterinarian */
export interface VetReview {
  id: string;
  vetId: string;
  reviewerId: string;
  rating: number; // 1-5
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}
