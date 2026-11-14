/**
 * Authentication & Identity Domain Types
 * Corresponds to future implementation in Issue #15 (Supabase Auth & RLS) and Issue #18 (Authentication UI)
 */

export type UserRole = "owner" | "editor" | "viewer";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
