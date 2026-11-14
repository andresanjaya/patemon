/**
 * Wedding Workspace Domain Types
 * Corresponds to Issue #14 (Database Schema), Issue #15 (RLS), and Issue #19 (Wedding Workspace)
 */

export type MarriageForm = "memadik" | "ngerorod" | "nyentana" | "custom";

export type WorkspaceRole = "owner" | "editor" | "viewer";

export interface WeddingWorkspace {
  id: string;
  slug: string | null;
  coupleNames: string;
  groomName: string | null;
  brideName: string | null;
  prospectiveDate: string | null;
  locationRegion: string | null;
  marriageForm: MarriageForm;
  targetBudget: number; // Integer IDR
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  weddingId: string;
  userId: string | null;
  role: WorkspaceRole;
  invitedEmail: string;
  invitedBy: string | null;
  joinedAt: string | null;
  status?: string;
  createdAt?: string;
  profile?: {
    fullName: string | null;
    email: string | null;
    phone: string | null;
  };
}

export interface WorkspaceSummary {
  id: string;
  coupleNames: string;
  prospectiveDate: string | null;
  locationRegion: string | null;
  marriageForm: MarriageForm;
  targetBudget: number;
  userRole: WorkspaceRole;
}

export interface CreateWorkspaceInput {
  coupleNames: string;
  groomName?: string | null;
  brideName?: string | null;
  prospectiveDate?: string | null;
  locationRegion?: string | null;
  marriageForm?: MarriageForm;
  targetBudget?: number;
  notes?: string | null;
}

export interface UpdateWorkspaceInput {
  coupleNames?: string;
  groomName?: string | null;
  brideName?: string | null;
  prospectiveDate?: string | null;
  locationRegion?: string | null;
  marriageForm?: MarriageForm;
  targetBudget?: number;
  notes?: string | null;
}
