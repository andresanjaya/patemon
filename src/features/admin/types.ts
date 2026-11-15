/**
 * Platform Admin Operations & Support Domain Types (Issue #81)
 * Enforces data minimization: only operational support data is visible to admins.
 * Confidential guest lists, private family notes, and customer secrets are never exposed.
 */

export type PlatformAdminRole = "superadmin" | "support_operator";

export type AdminAuditAction =
  | "grant_override"
  | "revoke_grant"
  | "freeze_wedding"
  | "unfreeze_wedding"
  | "reconcile_order";

export interface AdminWeddingSummary {
  weddingId: string;
  slug: string | null;
  coupleNames: string;
  ownerEmail: string | null;
  ownerName: string | null;
  locationRegion: string | null;
  prospectiveDate: string | null;
  isFrozen: boolean;
  frozenReason: string | null;
  frozenAt: string | null;
  frozenBy: string | null;
  createdAt: string;
  licenseStatus: "active" | "expired" | "revoked" | "unpaid";
  grantType: "payment" | "manual_override" | "promotional" | null;
  grantedBy: string | null;
  overrideReason: string | null;
  totalOrders: number;
  lastOrder: {
    orderNumber: string;
    amount: number;
    status: string;
    createdAt: string;
  } | null;
}

export interface AdminOrderDetail {
  id: string;
  orderNumber: string;
  weddingId: string;
  amount: number;
  status: string;
  paymentType: string | null;
  transactionTime: string | null;
  settlementTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAccessGrant {
  id: string;
  weddingId: string;
  orderId: string | null;
  status: "active" | "expired" | "revoked";
  grantType: "payment" | "manual_override" | "promotional";
  grantedBy: string | null;
  overrideReason: string | null;
  referenceProof: string | null;
  grantedAt: string;
  validUntil: string | null;
  revokedAt: string | null;
}

export interface AdminAuditLog {
  id: string;
  adminUserId: string | null;
  adminEmail: string;
  action: AdminAuditAction;
  targetType: "wedding" | "order" | "access_grant" | "account";
  targetId: string;
  reason: string;
  referenceNote: string | null;
  beforeState: unknown;
  afterState: unknown;
  correlationId: string;
  createdAt: string;
}

export interface GrantOverrideInput {
  weddingId: string;
  reason: string;
  referenceProof: string;
  durationDays: number;
}

export interface RevokeGrantInput {
  weddingId: string;
  grantId?: string;
  reason: string;
}

export interface FreezeWeddingInput {
  weddingId: string;
  reason: string;
}

export interface ReconcileOrderInput {
  orderId: string;
  weddingId?: string;
  reason: string;
}
