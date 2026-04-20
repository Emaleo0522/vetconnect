export interface User {
  id: string;
  name: string;
  email: string;
  role: "owner" | "vet" | "org" | "admin";
  avatarUrl?: string;
  phone?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  species: "dog" | "cat" | "bird" | "reptile" | "other";
  breed?: string;
  age?: number;
  weight?: number;
  photoUrl?: string;
  medicalNotes?: string;
}

export interface Veterinarian {
  id: string;
  userId: string;
  name: string;
  specialty: string;
  clinicName: string;
  address: string;
  phone: string;
  rating: number;
  reviewCount: number;
  location: {
    latitude: number;
    longitude: number;
  };
  availableSlots?: TimeSlot[];
}

export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface Appointment {
  id: string;
  petId: string;
  vetId: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  reason: string;
  notes?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: "appointment" | "reminder" | "alert" | "system";
  read: boolean;
  createdAt: string;
}
