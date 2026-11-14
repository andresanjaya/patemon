/**
 * Wedding Workspace Domain Types
 * Corresponds to future implementation in Issue #14 (Database Schema) and Issue #19 (Wedding Workspace)
 */

export type MarriageForm = "memadik" | "ngerorod" | "nyentana" | "custom";

export interface WeddingWorkspace {
  id: string;
  coupleNames: string;
  prospectiveDate: string | null;
  locationRegion: string | null;
  marriageForm: MarriageForm;
  targetBudget: number; // Integer IDR
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  weddingId: string;
  userId: string;
  role: "owner" | "editor" | "viewer";
  invitedEmail: string;
  joinedAt: string | null;
}
