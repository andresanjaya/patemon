/**
 * Budget Management Domain Types
 * Corresponds to future implementation in Issue #28 (Budget Tracker)
 * NOTE: All monetary values MUST be stored as integer IDR (never floating point).
 */

export type BudgetCategory =
  | "upacara_banten"
  | "venue_dekorasi"
  | "busana_rias"
  | "konsumsi"
  | "dokumentasi"
  | "lain_lain";

export interface BudgetItem {
  id: string;
  weddingId: string;
  category: BudgetCategory;
  name: string;
  plannedAmount: number; // Integer IDR
  actualAmount: number; // Integer IDR
  paidAmount: number; // Integer IDR
  notes?: string;
}

export interface BudgetSummary {
  totalPlanned: number; // Integer IDR
  totalActual: number; // Integer IDR
  totalPaid: number; // Integer IDR
  remainingBudget: number; // Integer IDR
}
