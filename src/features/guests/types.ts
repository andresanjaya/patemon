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
  rsvpToken?: string | null;
  rsvpTokenRevokedAt?: string | null;
  rsvpAttendingCount?: number | null;
  rsvpNotes?: string | null;
  rsvpSubmittedAt?: string | null;
  rsvpDeadline?: string | null;
}

export interface CreateGuestInput {
  name: string;
  side?: GuestSide;
  groupHousehold?: string;
  headcount?: number;
  invitationStatus?: InvitationStatus;
  phone?: string;
  notes?: string;
  rsvpDeadline?: string | null;
}

export interface UpdateGuestInput {
  name?: string;
  side?: GuestSide;
  groupHousehold?: string | null;
  headcount?: number;
  invitationStatus?: InvitationStatus;
  phone?: string | null;
  notes?: string | null;
  rsvpAttendingCount?: number | null;
  rsvpNotes?: string | null;
  rsvpDeadline?: string | null;
}

export interface GuestStats {
  totalInvitations: number;
  totalHeadcount: number; // Sum of headcount excluding declined
  invitedHeadcount: number; // Total invited headcount across all states
  confirmedHeadcount: number; // Confirmed actual attending pax (considering rsvpAttendingCount)
  confirmedInvitations: number;
  sentInvitations: number;
  draftInvitations: number;
  pendingHeadcount: number; // Headcount awaiting RSVP response (draft + sent)
  pendingInvitations: number;
  declinedHeadcount: number;
  declinedInvitations: number;
  actualAttendingPax: number;
  groomHeadcount: number;
  brideHeadcount: number;
  mutualHeadcount: number;
}
