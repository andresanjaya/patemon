/**
 * Payment & Entitlement Domain Types
 * Corresponds to future implementation in Issue #36 (Midtrans Snap & Server Verification)
 */

export type PaymentStatus =
  "pending" | "settlement" | "expire" | "cancel" | "deny";

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
  status: "active" | "expired" | "revoked";
  validUntil?: string;
}
