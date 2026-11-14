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
  orderNumber: string;
  amount: number; // Integer IDR
  status: PaymentStatus;
  snapToken?: string | null;
  snapRedirectUrl?: string | null;
  paymentType?: string | null;
  transactionTime?: string | null;
  settlementTime?: string | null;
  rawResponse?: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface SnapTransactionRequest {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  item_details?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
    category?: string;
  }>;
  customer_details?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  callbacks?: {
    finish?: string;
  };
}

export interface SnapTransactionResponse {
  token: string;
  redirect_url: string;
  error_messages?: string[];
}

export interface CreateCheckoutResult {
  success: boolean;
  error?: string;
  orderId?: string;
  orderNumber?: string;
  snapToken?: string;
  redirectUrl?: string;
  clientKey?: string;
  snapUrl?: string;
  isReused?: boolean;
}

export interface SnapCallbackResult {
  status_code?: string;
  status_message?: string;
  transaction_id?: string;
  order_id?: string;
  gross_amount?: string;
  payment_type?: string;
  transaction_time?: string;
  transaction_status?: string;
  fraud_status?: string;
  finish_redirect_url?: string;
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

export interface MidtransNotificationPayload {
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string;
  gross_amount: string;
  fraud_status?: string;
  currency?: string;
  settlement_time?: string;
  merchant_id?: string;
  channel_response_message?: string;
  channel_response_code?: string;
  [key: string]: unknown;
}

export interface WebhookProcessResult {
  success: boolean;
  statusCode: number;
  status?:
    | "processed"
    | "already_processed"
    | "ignored"
    | "invalid_signature"
    | "order_not_found"
    | "error";
  error?: string;
  orderId?: string;
  orderNumber?: string;
  weddingId?: string;
  entitlementActivated?: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
}
