import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock Next.js cache revalidation
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Supabase Server Client
vi.mock("../src/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock Supabase Admin Client
vi.mock("../src/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from "../src/lib/supabase/server";
import { createAdminClient } from "../src/lib/supabase/admin";
import {
  submitManualPaymentRequestAction,
  getLatestOrderForWedding,
  getOrderHistoryForWedding,
  cancelPendingOrderAction,
} from "../src/features/payments/orders";
import {
  adminActivateManualPaymentAction,
  reconcileOrderAdminAction,
} from "../src/features/admin/actions";
import {
  formatPaymentConfirmationWhatsAppLink,
  calculateAccessStateDetails,
} from "../src/features/payments/support";
import {
  MVP_WEDDING_PRICE_IDR,
  PAYMENT_CONFIG,
} from "../src/features/payments/pricing";
import type { WorkspaceEntitlement } from "../src/features/payments/types";

describe("Manual Payment (BCA/QRIS) & Master Admin 1-Click Activation Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PLATFORM_ADMIN_EMAILS = "admin@patemon.id,andresanjaya0707@gmail.com";
  });

  describe("WhatsApp Confirmation Link Builder & Payment Configuration", () => {
    it("has valid default payment configurations for BCA and QRIS", () => {
      expect(PAYMENT_CONFIG.bca.bankName).toBe("BCA");
      expect(PAYMENT_CONFIG.bca.accountNumber).toBe("0402838121");
      expect(PAYMENT_CONFIG.bca.accountHolder).toBe("Andre Sanjaya");
      expect(MVP_WEDDING_PRICE_IDR).toBe(199_000);
    });

    it("generates prefilled WhatsApp link with all order metadata", () => {
      const link = formatPaymentConfirmationWhatsAppLink({
        weddingId: "wed-test-123",
        coupleNames: "Gede & Ketut",
        userEmail: "gede@example.com",
        orderNumber: "PATEMON-TEST-ORD1",
        paymentMethod: "manual_bca",
        senderName: "I Gede Bagus",
      });

      expect(link).toContain("https://wa.me/");
      expect(link).toContain("PATEMON-TEST-ORD1");
      expect(link).toContain("Gede%20%26%20Ketut");
      expect(link).toContain("I%20Gede%20Bagus");
      expect(link).toContain("Transfer%20Bank%20BCA");
      expect(link).toContain("Rp%20199.000");
    });

    it("handles QRIS payment method in WhatsApp confirmation link", () => {
      const link = formatPaymentConfirmationWhatsAppLink({
        weddingId: "wed-test-123",
        coupleNames: "Made & Putu",
        orderNumber: "PATEMON-TEST-ORD2",
        paymentMethod: "manual_qris",
      });

      expect(link).toContain("QRIS");
      expect(link).toContain("PATEMON-TEST-ORD2");
    });
  });

  describe("submitManualPaymentRequestAction Guardrails", () => {
    it("rejects upgrade requests on Demo workspace", async () => {
      const res = await submitManualPaymentRequestAction({
        weddingId: "demo",
        paymentMethod: "manual_bca",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("Workspace Demo");
    });

    it("rejects unauthenticated user", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error("Not logged in"),
          }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const res = await submitManualPaymentRequestAction({
        weddingId: "wed-1",
        paymentMethod: "manual_bca",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("Sesi telah berakhir");
    });

    it("rejects non-owner member", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-editor", email: "editor@test.com" } },
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
                      data: { role: "editor" },
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
                    data: { id: "wed-1", created_by: "user-owner" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const res = await submitManualPaymentRequestAction({
        weddingId: "wed-1",
        paymentMethod: "manual_bca",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("Hanya pemilik (owner)");
    });

    it("successfully creates pending order and generates WhatsApp link for workspace owner", async () => {
      const mockInsertOrder = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "ord-new-1" },
            error: null,
          }),
        }),
      });
      const mockInsertLog = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-owner", email: "owner@test.com" } },
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
                      id: "wed-1",
                      couple_names: "Wayan & Ketut",
                      created_by: "user-owner",
                    },
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
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: null,
                        error: null,
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
                            data: null,
                            error: null,
                          }),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
              insert: mockInsertOrder,
            };
          }
          if (table === "activity_logs") {
            return { insert: mockInsertLog };
          }
          return {};
        }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const res = await submitManualPaymentRequestAction({
        weddingId: "wed-1",
        paymentMethod: "manual_bca",
        senderName: "Wayan Sudirga",
      });

      expect(res.success).toBe(true);
      expect(res.orderId).toBe("ord-new-1");
      expect(res.whatsappUrl).toBeDefined();
      expect(res.whatsappUrl).toContain("Wayan%20Sudirga");
      expect(mockInsertOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          wedding_id: "wed-1",
          amount: 199_000,
          status: "pending",
          payment_type: "manual_bca",
        })
      );
    });
  });

  describe("Master Admin 1-Click Activation Action (adminActivateManualPaymentAction)", () => {
    it("rejects unauthorized non-admin session", async () => {
      // Setup mock where logged in user is NOT in PLATFORM_ADMIN_EMAILS
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "hacker-1", email: "stranger@other.com" } },
            error: null,
          }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const res = await adminActivateManualPaymentAction({
        weddingId: "wed-1",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("Akses ditolak");
    });

    it("rejects activation if workspace is frozen", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "admin-1", email: "admin@patemon.id" } },
            error: null,
          }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "weddings") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: "wed-frozen", couple_names: "Frozen Couple", is_frozen: true },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      } as unknown as ReturnType<typeof createAdminClient>);

      const res = await adminActivateManualPaymentAction({
        weddingId: "wed-frozen",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("dibekukan");
    });

    it("settles pending order, creates 365-day access grant, and logs audit entries", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "admin-1", email: "admin@patemon.id" } },
            error: null,
          }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const mockOrderUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      const mockGrantInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "grant-act-1",
              wedding_id: "wed-1",
              status: "active",
              valid_until: "2027-11-20T00:00:00.000Z",
            },
            error: null,
          }),
        }),
      });
      const mockAuditInsert = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "weddings") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: "wed-1", couple_names: "Komang & Luh", is_frozen: false },
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
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({
                          data: {
                            id: "ord-pend-1",
                            order_number: "PATEMON-TEST-P1",
                            status: "pending",
                            payment_type: "manual_bca",
                          },
                          error: null,
                        }),
                      }),
                    }),
                  }),
                }),
              }),
              update: mockOrderUpdate,
            };
          }
          if (table === "access_grants") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: null,
                      error: null,
                    }),
                  }),
                }),
              }),
              insert: mockGrantInsert,
            };
          }
          if (table === "admin_audit_logs" || table === "activity_logs") {
            return { insert: mockAuditInsert };
          }
          return {};
        }),
      } as unknown as ReturnType<typeof createAdminClient>);

      const res = await adminActivateManualPaymentAction({
        weddingId: "wed-1",
        notes: "Bukti transfer BCA via WA terverifikasi.",
      });

      expect(res.success).toBe(true);
      expect(res.grantId).toBe("grant-act-1");
      expect(res.orderId).toBe("ord-pend-1");
      expect(res.message).toContain("365 hari");
      expect(mockOrderUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "settlement",
        })
      );
      expect(mockGrantInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          wedding_id: "wed-1",
          status: "active",
          grant_type: "payment",
          granted_by: "admin@patemon.id",
        })
      );
      expect(mockAuditInsert).toHaveBeenCalled();
    });
  });

  describe("reconcileOrderAdminAction", () => {
    it("successfully delegates to manual payment activation for order", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "admin-1", email: "admin@patemon.id" } },
            error: null,
          }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "weddings") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: "wed-1", couple_names: "Komang & Luh", is_frozen: false },
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
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "ord-spec-1",
                      order_number: "PATEMON-SPEC-1",
                      wedding_id: "wed-1",
                      status: "pending",
                      payment_type: "manual_qris",
                    },
                    error: null,
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            };
          }
          if (table === "access_grants") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "grant-spec-1", status: "active" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "admin_audit_logs" || table === "activity_logs") {
            return { insert: vi.fn().mockResolvedValue({ error: null }) };
          }
          return {};
        }),
      } as unknown as ReturnType<typeof createAdminClient>);

      const res = await reconcileOrderAdminAction({
        orderId: "ord-spec-1",
        reason: "Konfirmasi transfer QRIS manual",
      });

      expect(res.success).toBe(true);
      expect(res.currentStatus).toBe("settlement");
      expect(res.accessGranted).toBe(true);
    });
  });

  describe("cancelPendingOrderAction", () => {
    it("successfully cancels pending checkout order", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      });

      vi.mocked(createClient).mockResolvedValue({
        from: vi.fn().mockReturnValue({
          update: mockUpdate,
        }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const res = await cancelPendingOrderAction("wed-1", "PATEMON-CANCEL-1");
      expect(res.success).toBe(true);
    });
  });

  describe("calculateAccessStateDetails", () => {
    it("recognizes active paid entitlement and enables full capabilities", () => {
      const entitlement: WorkspaceEntitlement = {
        weddingId: "wed-test",
        isPaid: true,
        status: "active",
        isDemo: false,
        grantedAt: "2026-11-18T00:00:00Z",
        validUntil: "2027-11-18T00:00:00Z",
        canEdit: true,
        canInviteMembers: true,
        canExportCSV: true,
        planName: "Lisensi Penuh Pawiwahan",
        badgeLabel: "Aktif",
        daysRemaining: 365,
      };

      const details = calculateAccessStateDetails(entitlement);
      expect(details.state).toBe("active_lifetime");
      expect(details.canEdit).toBe(true);
      expect(details.canInviteMembers).toBe(true);
      expect(details.canExportCSV).toBe(true);
    });
  });
});
