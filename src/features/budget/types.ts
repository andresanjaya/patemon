/**
 * Budget Management Domain Types for Patemon MVP v1 (Issue #28)
 * NOTE: All monetary values MUST be stored and computed as integer IDR (never floating point).
 */

export type BudgetItemStatus =
  "estimated" | "booked" | "paid_partial" | "paid_full" | "canceled";

export type BudgetCategory =
  | "upakara"
  | "tempat_dekorasi"
  | "busana_rias"
  | "konsumsi"
  | "dokumentasi"
  | "musik_hiburan"
  | "administrasi"
  | "lainnya";

export interface BudgetPayment {
  id: string;
  weddingId: string;
  budgetItemId: string;
  amount: number; // Integer IDR > 0
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: string | null;
  recipient: string | null;
  notes: string | null;
  receiptUrl: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface BudgetItem {
  id: string;
  weddingId: string;
  category: string;
  title: string;
  unit: string | null;
  quantity: number;
  unitPrice: number; // Integer IDR
  plannedAmount: number; // Integer IDR (quantity * unitPrice)
  actualAmount: number; // Integer IDR
  paidAmount: number; // Sum of recorded payments
  paidBy: string | null;
  status: BudgetItemStatus;
  linkedRitualItemId: string | null;
  linkedVendorId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  payments: BudgetPayment[];
}

export interface BudgetItemTemplate {
  id: string;
  category: BudgetCategory;
  title: string;
  unit: string;
  defaultQty: number;
  estimatedPrice: number; // Integer IDR
  notes: string;
  defaultPaidBy: string;
}

export interface CreateBudgetItemInput {
  title: string;
  category: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  plannedAmount?: number;
  actualAmount?: number;
  paidBy?: string;
  status?: BudgetItemStatus;
  notes?: string;
  linkedRitualItemId?: string;
  linkedVendorId?: string;
}

export interface UpdateBudgetItemInput {
  title?: string;
  category?: string;
  unit?: string | null;
  quantity?: number;
  unitPrice?: number;
  plannedAmount?: number;
  actualAmount?: number;
  paidBy?: string | null;
  status?: BudgetItemStatus;
  notes?: string | null;
  linkedRitualItemId?: string | null;
  linkedVendorId?: string | null;
  expectedUpdatedAt?: string;
}

export interface CreatePaymentInput {
  budgetItemId: string;
  amount: number; // Integer IDR > 0
  paymentDate: string; // YYYY-MM-DD
  paymentMethod?: string;
  recipient?: string;
  notes?: string;
  receiptUrl?: string;
}

export interface BudgetStats {
  targetBudget: number; // Workspace target budget
  totalPlanned: number; // Sum of planned amounts for non-canceled items
  totalActual: number; // Sum of actual amounts (or planned if actual == 0)
  totalPaid: number; // Sum of all recorded payments
  totalOutstanding: number; // totalActual - totalPaid (minimum 0)
  remainingBudget: number; // targetBudget - totalActual
  itemCount: number;
  paymentCount: number;
}
