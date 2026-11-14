/**
 * Vendor Management Domain Types for Patemon MVP v1 (Issue #29)
 * Covers Balinese wedding vendor contacts, categories, quotes, booking status, and payment tracking.
 * All monetary amounts are integer IDR (BIGINT in Postgres, whole numbers in TypeScript).
 */

export type VendorStatus =
  "prospect" | "contacted" | "quoted" | "booked" | "completed" | "canceled";

export type VendorCategory =
  | "fotografi_videografi"
  | "busana_rias"
  | "dekorasi_tenda"
  | "katering_mebat"
  | "musik_sound_gong"
  | "venue_bale"
  | "banten_serati"
  | "undangan_souvenir"
  | "lainnya";

export interface LinkedBudgetItemSummary {
  id: string;
  title: string;
  plannedAmount: number;
  actualAmount: number;
  paidAmount: number;
  status: string;
}

export interface Vendor {
  id: string;
  weddingId: string;
  category: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  socialLink: string | null;
  quoteAmount: number; // Integer IDR >= 0
  status: VendorStatus;
  picName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Computed & Linked payment fields
  agreedAmount: number; // Integer IDR (actual amount if linked budget exists and > 0, else quoteAmount if booked)
  paidAmount: number; // Sum of recorded payments from linked budget items
  dueAmount: number; // Math.max(0, agreedAmount - paidAmount)
  linkedBudgetItems: LinkedBudgetItemSummary[];
}

export interface VendorCategoryInfo {
  id: VendorCategory;
  name: string;
  description: string;
  badgeClass: string;
  iconName: string;
}

export interface VendorTemplate {
  id: string;
  category: VendorCategory;
  name: string;
  recommendedScope: string;
  estimatedQuoteRange: string;
  notes: string;
  defaultPicRole: string;
}

export interface CreateVendorInput {
  name: string;
  category: string;
  contactPerson?: string;
  phone?: string;
  socialLink?: string;
  quoteAmount?: number; // Integer IDR >= 0
  status?: VendorStatus;
  picName?: string;
  notes?: string;
  createLinkedBudgetItem?: boolean;
}

export interface UpdateVendorInput {
  name?: string;
  category?: string;
  contactPerson?: string | null;
  phone?: string | null;
  socialLink?: string | null;
  quoteAmount?: number;
  status?: VendorStatus;
  picName?: string | null;
  notes?: string | null;
}

export interface VendorStats {
  totalVendors: number;
  bookedVendors: number;
  prospectVendors: number;
  completedVendors: number;
  totalQuoteAmount: number;
  totalAgreedAmount: number;
  totalPaidAmount: number;
  totalDueAmount: number;
}
