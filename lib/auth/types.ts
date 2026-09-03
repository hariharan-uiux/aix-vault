export type UserRole = "user" | "admin";

export type UserProfile = {
  id: string;
  email: string | null;
  role: UserRole;
  createdAt?: string;
};
