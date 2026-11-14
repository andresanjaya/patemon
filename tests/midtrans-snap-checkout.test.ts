import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only for Vitest environment
vi.mock("server-only", () => ({}));

import {
  createCheckoutOrderAction,
  getLatestOrderForWedding,
  getOrderHistoryForWedding,
  cancelPendingOrderAction,
} from "@/features/payments/orders";
import { generateOrderNumber } from "@/features/payments/utils";
import {
  getMidtransConfig,
  createSnapTransaction,
} from "@/features/payments/midtrans";
import { MVP_WEDDING_PRICE_IDR } from "@/features/payments/pricing";
import { createClient } from "@/lib/supabase/server";

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("Midtrans Snap Checkout & Order Persistence (Issue #36)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Server-Side Price & Configuration Guarantees", () => {
    it("strictly locks checkout price to server constant MVP_WEDDING_PRICE_IDR (PRD 5.4)", () => {
      expect(MVP_WEDDING_PRICE_IDR).toBe(199_000);
      expect(typeof MVP_WEDDING_PRICE_IDR).toBe("number");
      expect(Number.isInteger(MVP_WEDDING_PRICE_IDR)).toBe(true);
    });

    it("generates collision-resistant, well-formatted order numbers", () => {
      const weddingId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
      const orderNum1 = generateOrderNumber(weddingId);
      const orderNum2 = generateOrderNumber(weddingId);

      expect(orderNum1).toMatch(
        /^PATEMON-[A-Z0-9]{4,8}-[A-Z0-9]+-[A-Z0-9]{4}$/
      );
      expect(orderNum2).toMatch(
        /^PATEMON-[A-Z0-9]{4,8}-[A-Z0-9]+-[A-Z0-9]{4}$/
      );
      expect(orderNum1).not.toBe(orderNum2);
      expect(orderNum1.startsWith("PATEMON-F47AC10B-")).toBe(true);
    });

    it("detects mock / sandbox mode in test environments", () => {
      const config = getMidtransConfig();
      expect(config.isMockMode).toBe(true);
      expect(config.snapApiUrl).toContain("midtrans.com");
      expect(config.snapScriptUrl).toContain("snap.js");
    });

    it("generates deterministic mock Snap token and redirect URL in test mode", async () => {
      const res = await createSnapTransaction({
        transaction_details: {
          order_id: "PATEMON-TEST-12345",
          gross_amount: 199_000,
        },
      });

      expect(res.token).toBeDefined();
      expect(res.token.startsWith("mock-snap-")).toBe(true);
      expect(res.redirect_url).toContain("/snap/v2/vtweb/mock-snap-");
    });
  });

  describe("Checkout Order Creation Guardrails (createCheckoutOrderAction)", () => {
    it("blocks checkout attempt on Demo sandbox workspace", async () => {
      const res = await createCheckoutOrderAction("demo");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Workspace Demo adalah pratinjau publik");
    });

    it("returns error when user is not authenticated", async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValueOnce({
            data: { user: null },
            error: new Error("No session"),
          }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const res = await createCheckoutOrderAction("wedding-123");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Sesi telah berakhir");
    });

    it("returns error when workspace is not found", async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValueOnce({
            data: { user: { id: "user-123", email: "user@example.com" } },
            error: null,
          }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "wedding_members") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi
                      .fn()
                      .mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            };
          }
          if (table === "weddings") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi
                    .fn()
                    .mockResolvedValue({ data: null, error: null }),
                }),
              }),
            };
          }
          return {};
        }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const res = await createCheckoutOrderAction("wedding-not-found");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Workspace pernikahan tidak ditemukan");
    });

    it("blocks non-members/unauthorized users from checkout", async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValueOnce({
            data: {
              user: { id: "stranger-123", email: "stranger@example.com" },
            },
            error: null,
          }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "wedding_members") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi
                      .fn()
                      .mockResolvedValue({ data: null, error: null }),
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
                      id: "wedding-123",
                      created_by: "original-owner-456",
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const res = await createCheckoutOrderAction("wedding-123");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Hanya pemilik atau pengelola workspace");
    });

    it("prevents duplicate purchase if workspace is already licensed and active", async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValueOnce({
            data: { user: { id: "owner-123", email: "owner@example.com" } },
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
                    data: { id: "wedding-123", created_by: "owner-123" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "access_grants") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({
                          data: {
                            id: "grant-1",
                            wedding_id: "wedding-123",
                            status: "active",
                            granted_at: new Date().toISOString(),
                            valid_until: new Date(
                              Date.now() + 86400000
                            ).toISOString(),
                          },
                          error: null,
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

      const res = await createCheckoutOrderAction("wedding-123");
      expect(res.success).toBe(false);
      expect(res.error).toContain("sudah memiliki Lisensi Penuh Pawiwahan");
    });

    it("reuses existing pending order within 45-minute window (idempotency)", async () => {
      const mockPendingOrder = {
        id: "order-pending-1",
        wedding_id: "wedding-123",
        user_id: "owner-123",
        order_number: "PATEMON-WED123-OLD-ABCD",
        amount: 199_000,
        status: "pending",
        snap_token: "mock-snap-existing-token",
        snap_redirect_url:
          "https://app.sandbox.midtrans.com/snap/v2/vtweb/mock-snap-existing-token",
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      };

      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValueOnce({
            data: { user: { id: "owner-123", email: "owner@example.com" } },
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
                    data: { id: "wedding-123", created_by: "owner-123" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "access_grants") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi
                          .fn()
                          .mockResolvedValue({ data: null, error: null }),
                      }),
                    }),
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
                            data: mockPendingOrder,
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

      const res = await createCheckoutOrderAction("wedding-123");
      expect(res.success).toBe(true);
      expect(res.isReused).toBe(true);
      expect(res.orderNumber).toBe(mockPendingOrder.order_number);
      expect(res.snapToken).toBe(mockPendingOrder.snap_token);
      expect(res.redirectUrl).toBe(mockPendingOrder.snap_redirect_url);
    });

    it("successfully creates and persists new checkout order when no pending order exists", async () => {
      let insertedOrderData: unknown = null;
      let insertedLogData: unknown = null;

      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValueOnce({
            data: { user: { id: "owner-123", email: "owner@example.com" } },
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
                    data: { id: "wedding-123", created_by: "owner-123" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "access_grants") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi
                          .fn()
                          .mockResolvedValue({ data: null, error: null }),
                      }),
                    }),
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
                            data: null, // No existing pending order
                            error: null,
                          }),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
              insert: vi.fn().mockImplementation((payload) => {
                insertedOrderData = payload;
                return {
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: "order-created-999" },
                      error: null,
                    }),
                  }),
                };
              }),
            };
          }
          if (table === "profiles") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      full_name: "I Wayan & Ni Kadek",
                      phone: "08123456789",
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "activity_logs") {
            return {
              insert: vi.fn().mockImplementation((payload) => {
                insertedLogData = payload;
                return Promise.resolve({ error: null });
              }),
            };
          }
          return {};
        }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const res = await createCheckoutOrderAction("wedding-123");
      expect(res.success).toBe(true);
      expect(res.isReused).toBe(false);
      expect(res.orderId).toBe("order-created-999");
      expect(res.orderNumber).toBeDefined();
      expect(res.snapToken).toBeDefined();

      // Verify persisted database record
      expect(insertedOrderData).toMatchObject({
        wedding_id: "wedding-123",
        user_id: "owner-123",
        amount: MVP_WEDDING_PRICE_IDR, // 199000
        status: "pending",
      });

      // Verify audit trail
      expect(insertedLogData).toMatchObject({
        wedding_id: "wedding-123",
        user_id: "owner-123",
        action: "payment.checkout_initiated",
      });
    });
  });

  describe("Order Querying and Cancellation Operations", () => {
    it("fetches latest order and maps database fields properly", async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "ord-1",
                      wedding_id: "w-1",
                      user_id: "u-1",
                      order_number: "PATEMON-W1-123",
                      amount: 199_000,
                      status: "pending",
                      snap_token: "tok-1",
                      snap_redirect_url: "https://midtrans.com/pay",
                      payment_type: "qris",
                      transaction_time: null,
                      settlement_time: null,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const order = await getLatestOrderForWedding("w-1");
      expect(order).not.toBeNull();
      expect(order?.orderNumber).toBe("PATEMON-W1-123");
      expect(order?.amount).toBe(199_000);
      expect(order?.status).toBe("pending");
    });

    it("fetches order history for workspace", async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "ord-1",
                    wedding_id: "w-1",
                    user_id: "u-1",
                    order_number: "PATEMON-W1-123",
                    amount: 199_000,
                    status: "settlement",
                    snap_token: "tok-1",
                    snap_redirect_url: null,
                    payment_type: "bank_transfer",
                    transaction_time: null,
                    settlement_time: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const history = await getOrderHistoryForWedding("w-1");
      expect(history.length).toBe(1);
      expect(history[0].orderNumber).toBe("PATEMON-W1-123");
      expect(history[0].status).toBe("settlement");
    });

    it("cancels pending order successfully", async () => {
      let updatePayload: unknown = null;

      vi.mocked(createClient).mockResolvedValueOnce({
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockImplementation((payload) => {
            updatePayload = payload;
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

      const res = await cancelPendingOrderAction("w-1", "PATEMON-W1-123");
      expect(res.success).toBe(true);
      expect(updatePayload).toMatchObject({
        status: "cancel",
      });
    });
  });
});
