/**
 * Banten & Sarana Ritual Domain Types
 * Corresponds to future implementation in Issue #16 (Ritual Seed Data) and Issue #25 (Banten Planner)
 */

export type BantenAcquisitionStatus =
  "needed" | "ordered" | "making" | "ready" | "not_needed";

export type SourcingMethod =
  "self_made" | "purchased_package" | "family_assigned";

export interface BantenItem {
  id: string;
  weddingId: string;
  name: string;
  category: "utama" | "madya" | "nista" | "sarana_pelengkap";
  quantity: number;
  unit: string;
  sourcingMethod: SourcingMethod;
  status: BantenAcquisitionStatus;
  assigneeName?: string;
  estimatedPrice: number; // Integer IDR
  actualPrice?: number; // Integer IDR
  notes?: string;
}
