/**
 * Banten & Sarana Ritual Domain Types
 * Corresponds to Issue #14 (Database Schema), Issue #16 (Ritual Seed Data), and Issue #26 (Banten Planner)
 */

export type BantenAcquisitionStatus =
  "needed" | "ordered" | "making" | "ready" | "not_needed";

export type SourcingMethod =
  "self_made" | "purchased_package" | "family_assigned";

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
