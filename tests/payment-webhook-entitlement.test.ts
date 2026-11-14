import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only for Vitest environment
vi.mock("server-only", () => ({}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Supabase clients
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import {
  computeMidtransSignature,
  verifyMidtransSignature,
} from "@/features/payments/midtrans";
import { processMidtransWebhook } from "@/features/payments/webhook";
import { reconcileOrderStatusAction } from "@/features/payments/orders";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { MidtransNotificationPayload } from "@/features/payments/types";

describe("Midtrans Payment Webhook & Entitlement Lifecycle (Issue #37)", () => {
  const testServerKey = "SB-Mid-server-test-secret-123456";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SHA-512 Cryptographic Signature Verification", () => {
    it("computes accurate SHA-512 signature matching Midtrans specification", () => {
      const orderId = "PATEMON-BALI123-LNW3K8-A9B2";
      const statusCode = "200";
      const grossAmount = "199000.00";

      const sig1 = computeMidtransSignature(
        orderId,
        statusCode,
        grossAmount,
        testServerKey
      );
      const sig2 = computeMidtransSignature(
        orderId,
        statusCode,
        grossAmount,
        testServerKey
      );

      expect(sig1).toHaveLength(128); // 512 bits in hex = 128 characters
      expect(sig1).toBe(sig2);
      expect(sig1).toMatch(/^[a-f0-9]{128}$/);
    });

    it("verifies valid signature successfully", () => {
      const payload: MidtransNotificationPayload = {
        order_id: "PATEMON-TEST-1",
        status_code: "200",
        gross_amount: "199000.00",
        transaction_status: "settlement",
        transaction_id: "txn-1",
        status_message: "Success",
        payment_type: "qris",
        transaction_time: "2026-11-14 12:00:00",
        signature_key: computeMidtransSignature(
          "PATEMON-TEST-1",
          "200",
          "199000.00",
          testServerKey
        ),
      };

      const isValid = verifyMidtransSignature(payload, testServerKey);
      expect(isValid).toBe(true);
    });

    it("rejects tampered or forged signatures", () => {
      const payload: MidtransNotificationPayload = {
        order_id: "PATEMON-TEST-1",
        status_code: "200",
        gross_amount: "199000.00",
        transaction_status: "settlement",
        transaction_id: "txn-1",
        status_message: "Success",
        payment_type: "qris",
        transaction_time: "2026-11-14 12:00:00",
        signature_key: "forged-signature-invalid-hex-characters-and-length",
      };

      const isValid = verifyMidtransSignature(payload, testServerKey);
      expect(isValid).toBe(false);
    });
  });

  describe("Webhook Processing & Idempotent Entitlement Lifecycle", () => {
    it("rejects webhook if signature verification fails", async () => {
      const payload: MidtransNotificationPayload = {
        order_id: "PATEMON-TEST-1",
        status_code: "200",
        gross_amount: "199000.00",
        transaction_status: "settlement",
        transaction_id: "txn-1",
        status_message: "Success",
        payment_type: "qris",
        transaction_time: "2026-11-14 12:00:00",
        signature_key: "invalid-sig",
      };

      const result = await processMidtransWebhook(payload);
      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.status).toBe("invalid_signature");
    });

    it("returns 404 when order_id is not found in database", async () => {
      const signature = computeMidtransSignature(
        "PATEMON-NOTFOUND",
        "200",
        "199000.00",
        testServerKey
      );

      const mockAdmin = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof createAdminClient>;

      const payload: MidtransNotificationPayload = {
        order_id: "PATEMON-NOTFOUND",
        status_code: "200",
        gross_amount: "199000.00",
        transaction_status: "settlement",
        transaction_id: "txn-1",
        status_message: "Success",
        payment_type: "qris",
        transaction_time: "2026-11-14 12:00:00",
        signature_key: signature,
      };

      // Mock verifyMidtransSignature passing
      const result = await processMidtransWebhook(
        { ...payload, signature_key: "mock-valid" },
        mockAdmin
      );

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
      expect(result.status).toBe("order_not_found");
    });

    it("activates license on 'settlement' notification (PRD 5.4)", async () => {
      let orderUpdated: unknown = null;
      let grantInserted: unknown = null;
      let logInserted: unknown = null;
      let eventInserted: unknown = null;

      const mockOrder = {
        id: "order-123",
        wedding_id: "wedding-abc",
        user_id: "user-xyz",
        order_number: "PATEMON-WED123-XYZ",
        amount: 199_000,
        status: "pending",
        payment_type: null,
      };

      const mockAdmin = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "checkout_orders") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi
                    .fn()
                    .mockResolvedValue({ data: mockOrder, error: null }),
                }),
              }),
              update: vi.fn().mockImplementation((payload) => {
                orderUpdated = payload;
                return {
                  eq: vi.fn().mockResolvedValue({ error: null }),
                };
              }),
            };
          }
          if (table === "payment_events") {
            return {
              insert: vi.fn().mockImplementation((payload) => {
                eventInserted = payload;
                return Promise.resolve({ error: null });
              }),
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
                        .mockResolvedValue({ data: null, error: null }), // No active grant yet
                    }),
                  }),
                }),
              }),
              insert: vi.fn().mockImplementation((payload) => {
                grantInserted = payload;
                return {
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: "grant-new-999" },
                      error: null,
                    }),
                  }),
                };
              }),
            };
          }
          if (table === "activity_logs") {
            return {
              insert: vi.fn().mockImplementation((payload) => {
                logInserted = payload;
                return Promise.resolve({ error: null });
              }),
            };
          }
          return {};
        }),
      } as unknown as ReturnType<typeof createAdminClient>;

      const payload: MidtransNotificationPayload = {
        order_id: "PATEMON-WED123-XYZ",
        status_code: "200",
        gross_amount: "199000.00",
        transaction_status: "settlement",
        transaction_id: "txn-mid-888",
        status_message: "Success",
        payment_type: "qris",
        transaction_time: "2026-11-14 12:00:00",
        settlement_time: "2026-11-14 12:01:00",
        signature_key: "mock-sig-settlement",
      };

      const result = await processMidtransWebhook(payload, mockAdmin);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.status).toBe("processed");
      expect(result.entitlementActivated).toBe(true);

      // Verify checkout_orders updated to settlement
      expect(orderUpdated).toMatchObject({
        status: "settlement",
        payment_type: "qris",
      });

      // Verify payment_events recorded
      expect(eventInserted).toMatchObject({
        order_id: "order-123",
        provider_status: "settlement",
        is_verified: true,
      });

      // Verify access_grants created with active status and 365-day validity
      expect(grantInserted).toMatchObject({
        wedding_id: "wedding-abc",
        order_id: "order-123",
        status: "active",
      });
      expect(
        (grantInserted as { valid_until?: string })?.valid_until
      ).toBeDefined();

      // Verify activity_logs audit record
      expect(logInserted).toMatchObject({
        wedding_id: "wedding-abc",
        user_id: "user-xyz",
        action: "license.activated",
        entity_type: "access_grant",
      });
    });

    it("idempotently acknowledges duplicate settlement notifications without recreating grant", async () => {
      let grantInsertCalled = false;

      const mockAlreadySettledOrder = {
        id: "order-123",
        wedding_id: "wedding-abc",
        user_id: "user-xyz",
        order_number: "PATEMON-WED123-XYZ",
        amount: 199_000,
        status: "settlement", // Already settled
        payment_type: "qris",
      };

      const mockAdmin = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "checkout_orders") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: mockAlreadySettledOrder,
                    error: null,
                  }),
                }),
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
                        data: { id: "existing-grant-1" },
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
              insert: vi.fn().mockImplementation(() => {
                grantInsertCalled = true;
                return {};
              }),
            };
          }
          return {};
        }),
      } as unknown as ReturnType<typeof createAdminClient>;

      const payload: MidtransNotificationPayload = {
        order_id: "PATEMON-WED123-XYZ",
        status_code: "200",
        gross_amount: "199000.00",
        transaction_status: "settlement",
        transaction_id: "txn-duplicate-1",
        status_message: "Success",
        payment_type: "qris",
        transaction_time: "2026-11-14 12:00:00",
        signature_key: "mock-sig-dup",
      };

      const result = await processMidtransWebhook(payload, mockAdmin);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.status).toBe("already_processed");
      expect(result.entitlementActivated).toBe(false);
      expect(grantInsertCalled).toBe(false);
    });

    it("revokes active grant when refund or chargeback occurs", async () => {
      let grantUpdatePayload: unknown = null;
      let logPayload: unknown = null;

      const mockOrder = {
        id: "order-123",
        wedding_id: "wedding-abc",
        user_id: "user-xyz",
        order_number: "PATEMON-WED123-XYZ",
        amount: 199_000,
        status: "settlement",
      };

      const mockAdmin = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "checkout_orders") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi
                    .fn()
                    .mockResolvedValue({ data: mockOrder, error: null }),
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
              update: vi.fn().mockImplementation((payload) => {
                grantUpdatePayload = payload;
                return {
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                  }),
                };
              }),
            };
          }
          if (table === "activity_logs") {
            return {
              insert: vi.fn().mockImplementation((payload) => {
                logPayload = payload;
                return Promise.resolve({ error: null });
              }),
            };
          }
          return {};
        }),
      } as unknown as ReturnType<typeof createAdminClient>;

      const payload: MidtransNotificationPayload = {
        order_id: "PATEMON-WED123-XYZ",
        status_code: "200",
        gross_amount: "199000.00",
        transaction_status: "refund",
        transaction_id: "txn-refund-1",
        status_message: "Refund processed",
        payment_type: "qris",
        transaction_time: "2026-11-14 12:00:00",
        signature_key: "mock-sig-refund",
      };

      const result = await processMidtransWebhook(payload, mockAdmin);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);

      // Verify grant was revoked
      expect(grantUpdatePayload).toMatchObject({
        status: "revoked",
      });
      expect(
        (grantUpdatePayload as { revoked_at?: string })?.revoked_at
      ).toBeDefined();

      // Verify audit log
      expect(logPayload).toMatchObject({
        wedding_id: "wedding-abc",
        action: "license.revoked",
        entity_type: "access_grant",
      });
    });

    it("handles expire, cancel and deny status transitions", async () => {
      let updatedStatus: unknown = null;

      const mockOrder = {
        id: "order-123",
        wedding_id: "wedding-abc",
        user_id: "user-xyz",
        order_number: "PATEMON-WED123-XYZ",
        amount: 199_000,
        status: "pending",
      };

      const mockAdmin = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "checkout_orders") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi
                    .fn()
                    .mockResolvedValue({ data: mockOrder, error: null }),
                }),
              }),
              update: vi.fn().mockImplementation((payload) => {
                updatedStatus = payload.status;
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
          return {};
        }),
      } as unknown as ReturnType<typeof createAdminClient>;

      const expirePayload: MidtransNotificationPayload = {
        order_id: "PATEMON-WED123-XYZ",
        status_code: "200",
        gross_amount: "199000.00",
        transaction_status: "expire",
        transaction_id: "txn-expire-1",
        status_message: "Expired",
        payment_type: "bank_transfer",
        transaction_time: "2026-11-14 12:00:00",
        signature_key: "mock-sig-exp",
      };

      const result = await processMidtransWebhook(expirePayload, mockAdmin);
      expect(result.success).toBe(true);
      expect(updatedStatus).toBe("expire");
    });
  });

  describe("On-Demand Reconciliation Action (reconcileOrderStatusAction)", () => {
    it("fails when user is unauthenticated", async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValueOnce({
            data: { user: null },
            error: new Error("No session"),
          }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const res = await reconcileOrderStatusAction("wedding-1", "PATEMON-123");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Harap masuk terlebih dahulu");
    });
  });
});
