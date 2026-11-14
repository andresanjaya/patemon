/**
 * Guest List & Household Domain Types for Patemon MVP v1 (Issue #30)
 * Handles Balinese wedding guest records, household groups, headcount, invitation status, and CSV export.
 */

export type GuestSide = "groom" | "bride" | "both" | "mutual";

export type InvitationStatus = "draft" | "sent" | "confirmed" | "declined";

export interface Guest {
  id: string;
  weddingId: string;
  name: string;
  side: GuestSide;
  groupHousehold: string | null;
  headcount: number;
  invitationStatus: InvitationStatus;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGuestInput {
  name: string;
  side?: GuestSide;
  groupHousehold?: string;
  headcount?: number;
  invitationStatus?: InvitationStatus;
  phone?: string;
  notes?: string;
}

export interface UpdateGuestInput {
  name?: string;
  side?: GuestSide;
  groupHousehold?: string | null;
  headcount?: number;
  invitationStatus?: InvitationStatus;
  phone?: string | null;
  notes?: string | null;
}

export interface GuestStats {
  totalInvitations: number;
  totalHeadcount: number; // Sum of headcount excluding declined
  confirmedHeadcount: number;
  confirmedInvitations: number;
  sentInvitations: number;
  draftInvitations: number;
  declinedHeadcount: number;
  declinedInvitations: number;
  groomHeadcount: number;
  brideHeadcount: number;
  mutualHeadcount: number;
}
