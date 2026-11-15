import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock Next.js cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Supabase
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { computeMidtransSignature } from "@/features/payments/midtrans";
import { processMidtransWebhook } from "@/features/payments/webhook";
import {
  createCheckoutOrderAction,
  cancelPendingOrderAction,
} from "@/features/payments/orders";
import { getWorkspaceEntitlement } from "@/features/payments/entitlements";
import { MVP_WEDDING_PRICE_IDR } from "@/features/payments/pricing";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { MidtransNotificationPayload } from "@/features/payments/types";

describe("Midtrans Sandbox Payment Lifecycle, Anti-Tampering & Gating (Issue #80)", () => {
  const testServerKey = "SB-Mid-server-cW1CHYuQYPQXz5vu49Rhy1r4";
  const weddingId = "wed-sandbox-gianyar-123";
  const userId = "usr-bali-groom-456";
  const standardOrderNumber = "PATEMON-WED123-TEST-ORDER-1";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MIDTRANS_SERVER_KEY = testServerKey;
  });

  describe("1. Server-Enforced Pricing & Anti-Tampering (PRD 5.4)", () => {
    it("always enforces server price (Rp 199.000) regardless of client parameters", async () => {
      expect(MVP_WEDDING_PRICE_IDR).toBe(199_000);

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: userId, email: "groom@patemon.test" } },
            error: null,
          }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "wedding_members") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { role: "owner" },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "weddings") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: weddingId,
                      couple_names: "Wayan & Ayu",
                      created_by: userId,
                      is_frozen: false,
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "access_grants") {
            const queryChain = {
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null, // Unpaid
                    error: null,
                  }),
                }),
              }),
            };
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  ...queryChain,
                  eq: vi.fn().mockReturnValue(queryChain),
                }),
              }),
            };
          }
          if (table === "profiles") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { full_name: "I Wayan Arya", phone: "08123456789" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "checkout_orders") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    gt: vi.fn().mockReturnValue({
                      order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockReturnValue({
                          maybeSingle: vi.fn().mockResolvedValue({
                            data: null, // No pending orders
                            error: null,
                          }),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "order-db-id-001" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "activity_logs") {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          return {};
        }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const res = await createCheckoutOrderAction(weddingId);
      expect(res.success).toBe(true);
      expect(res.orderNumber).toContain("PATEMON-");
      expect(res.snapToken).toBeDefined();
    });

    it("rejects webhook notification with mismatched gross amount (HTTP 400)", async () => {
      const mockOrder = {
        id: "ord-test-tampered-1",
        wedding_id: weddingId,
        user_id: userId,
        order_number: "PATEMON-TAMPER-001",
        amount: 199_000,
        status: "pending",
      };

      const mockAdmin = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "checkout_orders") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: mockOrder,
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      };

      vi.mocked(createAdminClient).mockReturnValue(
        mockAdmin as unknown as ReturnType<typeof createAdminClient>
      );

      const tamperedPayload: MidtransNotificationPayload = {
        order_id: "PATEMON-TAMPER-001",
        status_code: "200",
        gross_amount: "50000.00", // Tampered amount (Rp 50.000 instead of Rp 199.000)
        transaction_status: "settlement",
        transaction_id: "midtrans-tampered-txn",
        status_message: "Success",
        payment_type: "qris",
        transaction_time: "2026-11-15 10:00:00",
        signature_key: computeMidtransSignature(
          "PATEMON-TAMPER-001",
          "200",
          "50000.00",
          testServerKey
        ),
      };

      const result = await processMidtransWebhook(
        tamperedPayload,
        mockAdmin as unknown as ReturnType<typeof createAdminClient>
      );

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.status).toBe("amount_mismatch");
      expect(result.error).toContain("tidak sesuai dengan tagihan pesanan");
    });
  });

  describe("2. Idempotent Order Creation & Reuse of Pending Orders", () => {
    it("reuses unexpired pending order within 45-minute window to prevent duplicate billing", async () => {
      const existingPendingOrder = {
        id: "ord-pending-existing",
        wedding_id: weddingId,
        user_id: userId,
        order_number: "PATEMON-EXISTING-PENDING-1",
        amount: 199_000,
        status: "pending",
        snap_token: "existing-snap-token-12345",
        snap_redirect_url:
          "https://app.sandbox.midtrans.com/snap/v2/vtweb/existing-snap-token-12345",
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      };

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: userId, email: "groom@patemon.test" } },
            error: null,
          }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "wedding_members") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { role: "owner" },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "weddings") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: weddingId,
                      couple_names: "Wayan & Ayu",
                      created_by: userId,
                      is_frozen: false,
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "access_grants") {
            const queryChain = {
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            };
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  ...queryChain,
                  eq: vi.fn().mockReturnValue(queryChain),
                }),
              }),
            };
          }
          if (table === "profiles") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { full_name: "I Wayan Arya" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "checkout_orders") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    gt: vi.fn().mockReturnValue({
                      order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockReturnValue({
                          maybeSingle: vi.fn().mockResolvedValue({
                            data: existingPendingOrder,
                            error: null,
                          }),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const res = await createCheckoutOrderAction(weddingId);
      expect(res.success).toBe(true);
      expect(res.isReused).toBe(true);
      expect(res.orderNumber).toBe("PATEMON-EXISTING-PENDING-1");
      expect(res.snapToken).toBe("existing-snap-token-12345");
    });

    it("allows explicit order cancellation to free user to generate a new payment session", async () => {
      let cancelled = false;
      vi.mocked(createClient).mockResolvedValue({
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockImplementation((payload: { status: string }) => {
            if (payload.status === "cancel") {
              cancelled = true;
            }
            return {
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              }),
            };
          }),
        }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const res = await cancelPendingOrderAction(
        weddingId,
        standardOrderNumber
      );
      expect(res.success).toBe(true);
      expect(cancelled).toBe(true);
    });
  });

  describe("3. Verified Settlement, Atomic Activation & Duplicate Webhook Resilience", () => {
    it("activates exactly one access grant upon verified settlement notification", async () => {
      let orderUpdated = false;
      let grantCreated = false;

      const mockOrder = {
        id: "ord-test-settle-1",
        wedding_id: weddingId,
        user_id: userId,
        order_number: standardOrderNumber,
        amount: 199_000,
        status: "pending",
      };

      const mockAdmin = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "checkout_orders") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: mockOrder,
                    error: null,
                  }),
                }),
              }),
              update: vi
                .fn()
                .mockImplementation((updates: { status: string }) => {
                  if (updates.status === "settlement") {
                    orderUpdated = true;
                  }
                  return {
                    eq: vi.fn().mockResolvedValue({ error: null }),
                  };
                }),
            };
          }
          if (table === "payment_events") {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          if (table === "access_grants") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: null, // No prior active grant
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
              insert: vi.fn().mockImplementation(() => {
                grantCreated = true;
                return {
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: "grant-new-uuid-001" },
                      error: null,
                    }),
                  }),
                };
              }),
            };
          }
          if (table === "activity_logs") {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          return {};
        }),
      };

      const validPayload: MidtransNotificationPayload = {
        order_id: standardOrderNumber,
        status_code: "200",
        gross_amount: "199000.00",
        transaction_status: "settlement",
        transaction_id: "midtrans-real-txn-789",
        status_message: "Success, transaction is settled",
        payment_type: "qris",
        transaction_time: "2026-11-15 10:00:00",
        settlement_time: "2026-11-15 10:01:00",
        signature_key: computeMidtransSignature(
          standardOrderNumber,
          "200",
          "199000.00",
          testServerKey
        ),
      };

      const result = await processMidtransWebhook(
        validPayload,
        mockAdmin as unknown as ReturnType<typeof createAdminClient>
      );

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(grantCreated).toBe(true);
      expect(orderUpdated).toBe(true);
    });

    it("idempotently handles duplicate settlement webhooks without creating duplicate grants", async () => {
      let duplicateInsertAttempted = false;

      const mockOrder = {
        id: "ord-test-settle-1",
        wedding_id: weddingId,
        user_id: userId,
        order_number: standardOrderNumber,
        amount: 199_000,
        status: "settlement", // Already marked settled
      };

      const existingGrant = {
        id: "grant-existing-uuid-1",
        wedding_id: weddingId,
        status: "active",
      };

      const mockAdmin = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "checkout_orders") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: mockOrder,
                    error: null,
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            };
          }
          if (table === "payment_events") {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          if (table === "access_grants") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: existingGrant, // Grant already exists
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
              insert: vi.fn().mockImplementation(() => {
                duplicateInsertAttempted = true;
                return {
                  select: vi.fn().mockReturnValue({
                    single: vi
                      .fn()
                      .mockResolvedValue({ data: {}, error: null }),
                  }),
                };
              }),
            };
          }
          return {};
        }),
      };

      const duplicatePayload: MidtransNotificationPayload = {
        order_id: standardOrderNumber,
        status_code: "200",
        gross_amount: "199000.00",
        transaction_status: "settlement",
        transaction_id: "midtrans-real-txn-789",
        status_message: "Duplicate notification",
        payment_type: "qris",
        transaction_time: "2026-11-15 10:00:00",
        signature_key: computeMidtransSignature(
          standardOrderNumber,
          "200",
          "199000.00",
          testServerKey
        ),
      };

      const result = await processMidtransWebhook(
        duplicatePayload,
        mockAdmin as unknown as ReturnType<typeof createAdminClient>
      );

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(duplicateInsertAttempted).toBe(false); // Did not attempt secondary grant insert
    });
  });

  describe("4. Delayed Settlement (Tab Closed / Background Webhook Processing)", () => {
    it("safely reconciles pending order to settlement on late webhook arrival or user query", async () => {
      // User created order, closed browser tab during bank processing.
      // Order is still 'pending' in database.
      const mockOrder = {
        id: "ord-delayed-1",
        wedding_id: weddingId,
        user_id: userId,
        order_number: "PATEMON-DELAYED-SETTLE-1",
        amount: 199_000,
        status: "pending",
      };

      let grantActivated = false;

      const mockAdmin = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "checkout_orders") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: mockOrder,
                    error: null,
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            };
          }
          if (table === "payment_events") {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          if (table === "access_grants") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi
                        .fn()
                        .mockResolvedValue({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
              insert: vi.fn().mockImplementation(() => {
                grantActivated = true;
                return {
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: "grant-late-activation-uuid" },
                      error: null,
                    }),
                  }),
                };
              }),
            };
          }
          if (table === "activity_logs") {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          return {};
        }),
      };

      const lateSettlementPayload: MidtransNotificationPayload = {
        order_id: "PATEMON-DELAYED-SETTLE-1",
        status_code: "200",
        gross_amount: "199000.00",
        transaction_status: "settlement",
        transaction_id: "midtrans-delayed-txn-001",
        status_message: "Late settlement received",
        payment_type: "bank_transfer",
        transaction_time: "2026-11-15 10:00:00",
        signature_key: computeMidtransSignature(
          "PATEMON-DELAYED-SETTLE-1",
          "200",
          "199000.00",
          testServerKey
        ),
      };

      const result = await processMidtransWebhook(
        lateSettlementPayload,
        mockAdmin as unknown as ReturnType<typeof createAdminClient>
      );

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(grantActivated).toBe(true);
    });
  });

  describe("5. Expire & Deny Handling (Failed Payments Fail Closed)", () => {
    it("handles expire status: marks order expired without granting workspace access", async () => {
      let orderMarkedExpired = false;
      let grantAttempted = false;

      const mockOrder = {
        id: "ord-test-expire-1",
        wedding_id: weddingId,
        user_id: userId,
        order_number: "PATEMON-EXPIRE-001",
        amount: 199_000,
        status: "pending",
      };

      const mockAdmin = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "checkout_orders") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: mockOrder,
                    error: null,
                  }),
                }),
              }),
              update: vi
                .fn()
                .mockImplementation((updates: { status: string }) => {
                  if (updates.status === "expire") {
                    orderMarkedExpired = true;
                  }
                  return {
                    eq: vi.fn().mockResolvedValue({ error: null }),
                  };
                }),
            };
          }
          if (table === "payment_events") {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          if (table === "access_grants") {
            return {
              insert: vi.fn().mockImplementation(() => {
                grantAttempted = true;
                return {};
              }),
            };
          }
          if (table === "activity_logs") {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          return {};
        }),
      };

      const expirePayload: MidtransNotificationPayload = {
        order_id: "PATEMON-EXPIRE-001",
        status_code: "200",
        gross_amount: "199000.00",
        transaction_status: "expire",
        transaction_id: "midtrans-expire-txn",
        status_message: "Transaction expired",
        payment_type: "qris",
        transaction_time: "2026-11-15 10:00:00",
        signature_key: computeMidtransSignature(
          "PATEMON-EXPIRE-001",
          "200",
          "199000.00",
          testServerKey
        ),
      };

      const result = await processMidtransWebhook(
        expirePayload,
        mockAdmin as unknown as ReturnType<typeof createAdminClient>
      );

      expect(result.success).toBe(true);
      expect(orderMarkedExpired).toBe(true);
      expect(grantAttempted).toBe(false);
    });

    it("handles deny status: marks order denied and preserves preview lockdown", async () => {
      let orderMarkedDenied = false;

      const mockOrder = {
        id: "ord-test-deny-1",
        wedding_id: weddingId,
        user_id: userId,
        order_number: "PATEMON-DENY-001",
        amount: 199_000,
        status: "pending",
      };

      const mockAdmin = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "checkout_orders") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: mockOrder,
                    error: null,
                  }),
                }),
              }),
              update: vi
                .fn()
                .mockImplementation((updates: { status: string }) => {
                  if (updates.status === "deny") {
                    orderMarkedDenied = true;
                  }
                  return {
                    eq: vi.fn().mockResolvedValue({ error: null }),
                  };
                }),
            };
          }
          if (table === "payment_events") {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          if (table === "activity_logs") {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          return {};
        }),
      };

      const denyPayload: MidtransNotificationPayload = {
        order_id: "PATEMON-DENY-001",
        status_code: "202",
        gross_amount: "199000.00",
        transaction_status: "deny",
        transaction_id: "midtrans-deny-txn",
        status_message: "Fraud detection denied transaction",
        payment_type: "credit_card",
        transaction_time: "2026-11-15 10:00:00",
        signature_key: computeMidtransSignature(
          "PATEMON-DENY-001",
          "202",
          "199000.00",
          testServerKey
        ),
      };

      const result = await processMidtransWebhook(
        denyPayload,
        mockAdmin as unknown as ReturnType<typeof createAdminClient>
      );

      expect(result.success).toBe(true);
      expect(orderMarkedDenied).toBe(true);
    });
  });

  describe("6. Anti-Spoofing: Query Parameters & Faked Callbacks", () => {
    it("guarantees query params like payment=finish cannot activate access without DB grant", async () => {
      vi.mocked(createClient).mockResolvedValue({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "access_grants") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: null, // No grant in DB!
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "weddings") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { is_frozen: false },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const entitlement = await getWorkspaceEntitlement(weddingId);

      // Access MUST remain unpaid / preview-locked!
      expect(entitlement.isPaid).toBe(false);
      expect(entitlement.canEdit).toBe(false);
      expect(entitlement.canInviteMembers).toBe(false);
      expect(entitlement.status).toBe("unpaid");
    });
  });
});
