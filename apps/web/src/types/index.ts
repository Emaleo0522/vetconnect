/**
 * Shared frontend types.
 * Re-export from @vetconnect/shared when the package is linked.
 */

export type UserRole = "owner" | "vet" | "org" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image: string | null;
  phone: string | null;
}
