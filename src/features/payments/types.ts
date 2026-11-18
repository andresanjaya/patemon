/**
 * Payment & Entitlement Domain Types for Patemon
 * Covers monetization tiers, manual payment verification (BCA / QRIS), feature gating,
 * and Master Admin manual access grants.
 */

export type PaymentStatus =
  | "pending"
  | "settlement"
  | "expire"
  | "cancel"
  | "deny";

export type EntitlementStatus =
  | "free_preview"
  | "active"
  | "expired"
  | "revoked"
  | "unpaid"
  | "error";

export type ManualPaymentMethod = "manual_bca" | "manual_qris";

export interface CheckoutOrder {
  id: string;
  weddingId: string;
  userId: string;
  orderNumber: string;
  amount: number; // Integer IDR
  status: PaymentStatus;
  paymentType?: string | null;
  senderName?: string | null;
  snapToken?: string | null;
  snapRedirectUrl?: string | null;
  transactionTime?: string | null;
  settlementTime?: string | null;
  rawResponse?: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface ManualPaymentInput {
  weddingId: string;
  paymentMethod: ManualPaymentMethod;
  senderName?: string;
  notes?: string;
}

export interface ManualPaymentResult {
  success: boolean;
  error?: string;
  orderId?: string;
  orderNumber?: string;
  whatsappUrl?: string;
  isReused?: boolean;
}

export interface AccessGrant {
  id: string;
  weddingId: string;
  orderId?: string | null;
  status: "active" | "expired" | "revoked";
  grantType?: "payment" | "manual_override" | "manual_payment" | string;
  grantedBy?: string | null;
  overrideReason?: string | null;
  referenceProof?: string | null;
  grantedAt: string;
  validUntil?: string | null;
  revokedAt?: string | null;
}

export interface WorkspaceEntitlement {
  weddingId: string;
  status: EntitlementStatus;
  isPaid: boolean;
  isDemo: boolean;
  grantedAt: string | null;
  validUntil: string | null;
  canEdit: boolean;
  canInviteMembers: boolean;
  canExportCSV: boolean;
  planName: string;
  badgeLabel: string;
  daysRemaining: number | null;
  message?: string;
}

export interface PricingFeature {
  text: string;
  included: boolean;
  note?: string;
}

export interface PricingTier {
  id: string;
  name: string;
  tagline: string;
  price: number; // Integer IDR (0 for free)
  originalPrice?: number;
  priceLabel: string;
  periodLabel: string;
  badge?: string;
  popular?: boolean;
  features: PricingFeature[];
  ctaLabel: string;
  ctaHref: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}
