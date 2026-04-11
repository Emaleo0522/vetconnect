/** User roles across the platform */
export type UserRole = "owner" | "vet" | "org" | "admin";

/** User record */
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: UserRole;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Active session */
export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
}
