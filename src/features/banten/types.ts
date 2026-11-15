/**
 * Banten & Sarana Ritual Domain Types
 * Corresponds to Issue #14 (Database Schema), Issue #16 (Ritual Seed Data), and Issue #26 (Banten Planner)
 */

export type BantenAcquisitionStatus =
  "needed" | "ordered" | "making" | "ready" | "not_needed";

export type BantenReviewStatus =
  "draft" | "needs_review" | "needs_revision" | "approved";

export type ReviewerType = "internal_member" | "external_practitioner";

export type SourcingMethod =
  "self_made" | "purchased_package" | "family_assigned" | "vendor_order";

export interface SubmitBantenReviewInput {
  reviewStatus: BantenReviewStatus;
  reviewerName: string;
  reviewerType: ReviewerType;
  reviewNotes?: string | null;
  sourceReference?: string | null;
}

export interface SourceCitation {
  id: string;
  title: string;
  sourceType: string;
  usageNotes: string | null;
  sourceUrl: string | null;
}

export interface RitualCatalogItem {
  id: string;
  itemType: string; // 'Paket Banten' | 'Banten Satuan' | 'Sarana Upakara'
  name: string;
  usedInPhase: string | null;
  notes: string | null;
  obligationLevel: string;
  defaultQuantity: number | null;
  unit: string;
  defaultProvider: string | null;
  validationStatus: string;
  sourceId: string | null;
  sourceUrl: string | null;
  isActive: boolean;
}

export interface BantenItem {
  id: string;
  weddingId: string;
  ceremonyId?: string | null;
  ceremonyTitle?: string | null;
  catalogId?: string | null;
  name: string;
  category: "utama" | "madya" | "nista" | "sarana_pelengkap" | string;
  quantity: number;
  unit: string;
  sourcingMethod: SourcingMethod;
  status: BantenAcquisitionStatus;
  assigneeName?: string | null;
  estimatedPrice: number; // Integer IDR
  actualPrice: number; // Integer IDR
  notes?: string | null;
  reviewStatus?: BantenReviewStatus;
  reviewerName?: string | null;
  reviewerType?: ReviewerType | null;
  recordedByUserId?: string | null;
  recordedByName?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  sourceReference?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BantenSummaryStats {
  totalItems: number;
  readyCount: number;
  makingCount: number;
  orderedCount: number;
  neededCount: number;
  totalEstimatedCost: number;
  totalActualCost: number;
  approvedCount: number;
  needsReviewCount: number;
  needsRevisionCount: number;
}
