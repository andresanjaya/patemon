/**
 * Payment & Entitlement Domain Types for Patemon MVP v1 (Issue #35, #36, #37, #38)
 * Covers monetization tiers, pricing packages, feature gating, and server-enforced entitlements.
 */

export type PaymentStatus =
  "pending" | "settlement" | "expire" | "cancel" | "deny";

export type EntitlementStatus =
  "free_preview" | "active" | "expired" | "revoked";

export interface CheckoutOrder {
  id: string;
  weddingId: string;
  userId: string;
  amount: number; // Integer IDR
  status: PaymentStatus;
  snapToken?: string;
  snapRedirectUrl?: string;
  paymentType?: string;
  transactionTime?: string;
  settlementTime?: string;
}

export interface AccessGrant {
  id: string;
  weddingId: string;
  orderId?: string | null;
  status: "active" | "expired" | "revoked";
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
