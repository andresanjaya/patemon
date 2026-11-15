import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock server-only module for Vitest test environment
vi.mock("server-only", () => ({}));

import {
  isPlatformAdminEmail,
  verifyAdminSession,
  assertAdminSession,
} from "../src/features/admin/auth";
import {
  searchAdminWeddingsAction,
  getAdminWeddingDetailAction,
  grantAccessOverrideAction,
  revokeAccessGrantAction,
  freezeWeddingAction,
  unfreezeWeddingAction,
  reconcileOrderAdminAction,
  getAdminAuditLogsAction,
} from "../src/features/admin/actions";
import { getWorkspaceEntitlement } from "../src/features/payments/entitlements";

// Mock Supabase Server Client (User Session)
vi.mock("../src/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock Supabase Admin Service-Role Client
vi.mock("../src/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

// Mock Next.js cache revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Payments Order Reconcile Action
vi.mock("../src/features/payments/orders", () => ({
  reconcileOrderStatusAction: vi.fn(),
}));

describe("Operational Admin Panel & Access Overrides (Issue #81)", () => {
  const originalEnv = process.env.PLATFORM_ADMIN_EMAILS;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PLATFORM_ADMIN_EMAILS = "admin@patemon.id, superuser@bali.dev";
  });

  afterEach(() => {
    process.env.PLATFORM_ADMIN_EMAILS = originalEnv;
  });

  describe("Admin Authorization & Spoofing Defense (auth.ts)", () => {
    it("recognizes authorized platform admin emails case-insensitively with trimming", () => {
      expect(isPlatformAdminEmail("admin@patemon.id")).toBe(true);
      expect(isPlatformAdminEmail("  Admin@Patemon.ID  ")).toBe(true);
      expect(isPlatformAdminEmail("SUPERUSER@BALI.DEV")).toBe(true);
      expect(isPlatformAdminEmail("intruder@random.org")).toBe(false);
      expect(isPlatformAdminEmail("")).toBe(false);
      expect(isPlatformAdminEmail(null)).toBe(false);
      expect(isPlatformAdminEmail(undefined)).toBe(false);
    });

    it("fails closed when PLATFORM_ADMIN_EMAILS is unconfigured or empty", () => {
      delete process.env.PLATFORM_ADMIN_EMAILS;
      expect(isPlatformAdminEmail("admin@patemon.id")).toBe(false);

      process.env.PLATFORM_ADMIN_EMAILS = "";
      expect(isPlatformAdminEmail("admin@patemon.id")).toBe(false);
    });

    it("fails closed when user is unauthenticated or session fails", async () => {
      const { createClient } = await import("../src/lib/supabase/server");
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error("No session"),
          }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const verification = await verifyAdminSession();
      expect(verification.isAdmin).toBe(false);
      expect(verification.adminEmail).toBeNull();
      expect(verification.role).toBeNull();

      await expect(assertAdminSession()).rejects.toThrow(
        "Akses ditolak: Anda tidak memiliki wewenang administrator platform operasional."
      );
    });

    it("strictly prevents privilege escalation via customer raw_user_meta_data", async () => {
      const { createClient } = await import("../src/lib/supabase/server");
      const { createAdminClient } = await import("../src/lib/supabase/admin");

      // Attacker puts role: "superadmin" or is_admin: true inside their user_metadata
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "user-attacker-123",
                email: "customer@attacker.io",
                user_metadata: {
                  role: "superadmin",
                  is_platform_admin: true,
                  admin: true,
                },
                raw_user_meta_data: {
                  role: "superadmin",
                  is_platform_admin: true,
                },
              },
            },
            error: null,
          }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi
                  .fn()
                  .mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof createAdminClient>);

      const verification = await verifyAdminSession();
      expect(verification.isAdmin).toBe(false);
      expect(verification.role).toBeNull();

      await expect(assertAdminSession()).rejects.toThrow(/Akses ditolak/);
    });

    it("authorizes valid admin from database platform_admins table even if not in env var", async () => {
      const { createClient } = await import("../src/lib/supabase/server");
      const { createAdminClient } = await import("../src/lib/supabase/admin");

      process.env.PLATFORM_ADMIN_EMAILS = ""; // empty env

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "user-db-admin-99",
                email: "dbadmin@patemon.id",
              },
            },
            error: null,
          }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { role: "support_operator", is_active: true },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof createAdminClient>);

      const session = await assertAdminSession();
      expect(session.adminEmail).toBe("dbadmin@patemon.id");
      expect(session.role).toBe("support_operator");
    });
  });

  describe("Administrative Override: Grant Access Exception (Issue #81)", () => {
    it("validates operational justification length and reference proof before granting", async () => {
      const { createClient } = await import("../src/lib/supabase/server");
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "admin-1", email: "admin@patemon.id" } },
            error: null,
          }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      // Short reason (< 10 chars)
      const resShort = await grantAccessOverrideAction({
        weddingId: "w-test-1",
        reason: "too short",
        referenceProof: "TF-12345",
        durationDays: 30,
      });
      expect(resShort.success).toBe(false);
      expect(resShort.error).toContain("Alasan pengecualian");

      // Short proof (< 3 chars)
      const resProof = await grantAccessOverrideAction({
        weddingId: "w-test-1",
        reason: "Valid justification with more than 10 characters",
        referenceProof: "x",
        durationDays: 30,
      });
      expect(resProof.success).toBe(false);
      expect(resProof.error).toContain("Nomor referensi bukti");

      // Invalid duration
      const resDuration = await grantAccessOverrideAction({
        weddingId: "w-test-1",
        reason: "Valid justification with more than 10 characters",
        referenceProof: "TF-12345",
        durationDays: 1000,
      });
      expect(resDuration.success).toBe(false);
      expect(resDuration.error).toContain("Durasi akses");
    });

    it("creates grant_type manual_override without fabricating settled payment orders", async () => {
      const { createClient } = await import("../src/lib/supabase/server");
      const { createAdminClient } = await import("../src/lib/supabase/admin");

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "admin-1", email: "admin@patemon.id" } },
            error: null,
          }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const mockInsertGrant = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "grant-override-101", status: "active" },
            error: null,
          }),
        }),
      });

      const mockInsertAudit = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockImplementation((tableName: string) => {
          if (tableName === "weddings") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "w-target-1",
                      couple_names: "Wayan & Kadek",
                      is_frozen: false,
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (tableName === "checkout_orders") {
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
            };
          }
          if (tableName === "access_grants") {
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
              insert: mockInsertGrant,
            };
          }
          if (tableName === "admin_audit_logs") {
            return { insert: mockInsertAudit };
          }
          return {};
        }),
      } as unknown as ReturnType<typeof createAdminClient>);

      const result = await grantAccessOverrideAction({
        weddingId: "w-target-1",
        reason:
          "Keluarga mengalami kendala gateway Midtrans, bukti slip transfer BCA terverifikasi.",
        referenceProof: "TF-BCA-20261115-001",
        durationDays: 90,
      });

      expect(result.success).toBe(true);
      expect(result.grantId).toBe("grant-override-101");
      expect(result.correlationId).toMatch(/^CORR-ADM-/);

      // Verify grant payload: order_id must be null and grant_type must be manual_override
      expect(mockInsertGrant).toHaveBeenCalledWith(
        expect.objectContaining({
          wedding_id: "w-target-1",
          order_id: null,
          grant_type: "manual_override",
          status: "active",
          reference_proof: "TF-BCA-20261115-001",
        })
      );

      // Verify audit log payload
      expect(mockInsertAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          admin_email: "admin@patemon.id",
          action: "grant_override",
          target_type: "wedding",
          target_id: "w-target-1",
          reason:
            "Keluarga mengalami kendala gateway Midtrans, bukti slip transfer BCA terverifikasi.",
          reference_note: "TF-BCA-20261115-001",
        })
      );
    });
  });

  describe("Administrative Freeze & Revocation Controls", () => {
    it("freezes wedding workspace, records audit log, and revokes entitlement edit rights", async () => {
      const { createClient } = await import("../src/lib/supabase/server");
      const { createAdminClient } = await import("../src/lib/supabase/admin");

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "admin-1", email: "admin@patemon.id" } },
            error: null,
          }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const mockUpdateWedding = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      const mockInsertAudit = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockImplementation((tableName: string) => {
          if (tableName === "weddings") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "w-disputed-1",
                      couple_names: "Wayan & Kadek",
                      is_frozen: false,
                    },
                    error: null,
                  }),
                }),
              }),
              update: mockUpdateWedding,
            };
          }
          if (tableName === "admin_audit_logs") {
            return { insert: mockInsertAudit };
          }
          return {};
        }),
      } as unknown as ReturnType<typeof createAdminClient>);

      const freezeRes = await freezeWeddingAction({
        weddingId: "w-disputed-1",
        reason:
          "Laporan sengketa akun keluarga pada tiket #SUP-889. Kunci mutasi sementara.",
      });

      expect(freezeRes.success).toBe(true);
      expect(mockUpdateWedding).toHaveBeenCalledWith(
        expect.objectContaining({
          is_frozen: true,
          frozen_reason:
            "Laporan sengketa akun keluarga pada tiket #SUP-889. Kunci mutasi sementara.",
          frozen_by: "admin@patemon.id",
        })
      );
      expect(mockInsertAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "freeze_wedding",
          target_id: "w-disputed-1",
        })
      );
    });

    it("locks mutations when workspace is frozen even if active grant exists", async () => {
      const { createClient } = await import("../src/lib/supabase/server");

      vi.mocked(createClient).mockResolvedValue({
        from: vi.fn().mockImplementation((tableName: string) => {
          if (tableName === "access_grants") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: {
                          id: "grant-active-1",
                          status: "active",
                          granted_at: "2026-11-01T00:00:00Z",
                          valid_until: "2027-11-01T00:00:00Z",
                          grant_type: "payment",
                        },
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (tableName === "weddings") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      is_frozen: true,
                      frozen_reason: "Workspace dibekukan oleh admin platform.",
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

      const entitlement = await getWorkspaceEntitlement("w-frozen-1");

      expect(entitlement.status).toBe("revoked");
      expect(entitlement.canEdit).toBe(false);
      expect(entitlement.badgeLabel).toBe("Dibekukan Admin");
      expect(entitlement.message).toContain("dibekukan");
    });

    it("unfreezes wedding workspace and clears frozen metadata", async () => {
      const { createClient } = await import("../src/lib/supabase/server");
      const { createAdminClient } = await import("../src/lib/supabase/admin");

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "admin-1", email: "admin@patemon.id" } },
            error: null,
          }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      const mockInsertAudit = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockImplementation((tableName: string) => {
          if (tableName === "weddings") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "w-frozen-1",
                      couple_names: "Wayan & Kadek",
                      is_frozen: true,
                    },
                    error: null,
                  }),
                }),
              }),
              update: mockUpdate,
            };
          }
          if (tableName === "admin_audit_logs") {
            return { insert: mockInsertAudit };
          }
          return {};
        }),
      } as unknown as ReturnType<typeof createAdminClient>);

      const res = await unfreezeWeddingAction({
        weddingId: "w-frozen-1",
        reason: "Sengketa telah diselesaikan oleh kedua belah pihak.",
      });

      expect(res.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ is_frozen: false, frozen_reason: null })
      );
    });

    it("revokes active grant with audit logging", async () => {
      const { createClient } = await import("../src/lib/supabase/server");
      const { createAdminClient } = await import("../src/lib/supabase/admin");

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "admin-1", email: "admin@patemon.id" } },
            error: null,
          }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const mockUpdateGrant = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      const mockInsertAudit = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockImplementation((tableName: string) => {
          if (tableName === "access_grants") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        id: "grant-active-1",
                        wedding_id: "w-1",
                        status: "active",
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
              update: mockUpdateGrant,
            };
          }
          if (tableName === "admin_audit_logs") {
            return { insert: mockInsertAudit };
          }
          return {};
        }),
      } as unknown as ReturnType<typeof createAdminClient>);

      const res = await revokeAccessGrantAction({
        grantId: "grant-active-1",
        weddingId: "w-1",
        reason: "Permintaan pengembalian dana disetujui tim finance.",
      });

      expect(res.success).toBe(true);
      expect(mockUpdateGrant).toHaveBeenCalledWith(
        expect.objectContaining({ status: "revoked" })
      );
    });

    it("fetches wedding operational detail and recent audit logs", async () => {
      const { createClient } = await import("../src/lib/supabase/server");
      const { createAdminClient } = await import("../src/lib/supabase/admin");

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "admin-1", email: "admin@patemon.id" } },
            error: null,
          }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockImplementation((tableName: string) => {
          if (tableName === "weddings") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "w-1",
                      slug: "wayan-kadek",
                      couple_names: "Wayan & Kadek",
                      is_frozen: false,
                      created_by: "user-1",
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (tableName === "profiles") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      email: "wayan@bali.id",
                      full_name: "I Wayan Sujana",
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (
            tableName === "checkout_orders" ||
            tableName === "access_grants"
          ) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            };
          }
          if (tableName === "admin_audit_logs") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({
                        data: [
                          {
                            id: "log-1",
                            admin_email: "admin@patemon.id",
                            action: "grant_override",
                            target_type: "wedding",
                            target_id: "w-1",
                            reason: "Manual override support",
                            created_at: "2026-11-15T00:00:00Z",
                          },
                        ],
                        error: null,
                      }),
                    }),
                  }),
                }),
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "log-1",
                        admin_email: "admin@patemon.id",
                        action: "grant_override",
                        target_type: "wedding",
                        target_id: "w-1",
                        reason: "Manual override support",
                        created_at: "2026-11-15T00:00:00Z",
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      } as unknown as ReturnType<typeof createAdminClient>);

      const detailRes = await getAdminWeddingDetailAction("w-1");
      expect(detailRes.success).toBe(true);
      expect(detailRes.wedding?.coupleNames).toBe("Wayan & Kadek");

      const logsRes = await getAdminAuditLogsAction(10);
      expect(logsRes.success).toBe(true);
      expect(logsRes.logs).toHaveLength(1);
    });
  });

  describe("Payment Gateway Reconciliation & Data Minimization (PRD 5.4)", () => {
    it("reconciles order status idempotently and records audit entry with correlation ID", async () => {
      const { createClient } = await import("../src/lib/supabase/server");
      const { createAdminClient } = await import("../src/lib/supabase/admin");
      const { reconcileOrderStatusAction } =
        await import("../src/features/payments/orders");

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "admin-1", email: "admin@patemon.id" } },
            error: null,
          }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      vi.mocked(reconcileOrderStatusAction).mockResolvedValue({
        success: true,
        status: "settlement",
      });

      const mockInsertAudit = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockImplementation((tableName: string) => {
          if (tableName === "checkout_orders") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "ord-1",
                      wedding_id: "w-1",
                      status: "pending",
                      order_number: "PATEMON-WED-100",
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (tableName === "admin_audit_logs") {
            return { insert: mockInsertAudit };
          }
          return {};
        }),
      } as unknown as ReturnType<typeof createAdminClient>);

      const result = await reconcileOrderAdminAction({
        orderId: "ord-1",
        weddingId: "w-1",
        reason: "Customer reports paid via BCA VA but webhook was delayed.",
      });

      expect(result.success).toBe(true);
      expect(result.currentStatus).toBe("settlement");
      expect(result.accessGranted).toBe(true);
      expect(reconcileOrderStatusAction).toHaveBeenCalledWith(
        "w-1",
        "PATEMON-WED-100"
      );
      expect(mockInsertAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "reconcile_order",
          target_type: "order",
          target_id: "ord-1",
          reason: "Customer reports paid via BCA VA but webhook was delayed.",
        })
      );
    });

    it("strictly minimizes data: admin queries omit guest lists, RSVP, and private vows", async () => {
      const { createClient } = await import("../src/lib/supabase/server");
      const { createAdminClient } = await import("../src/lib/supabase/admin");

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "admin-1", email: "admin@patemon.id" } },
            error: null,
          }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const mockFrom = vi.fn().mockImplementation((tableName: string) => {
        if (tableName === "weddings") {
          return {
            select: vi.fn().mockImplementation((columns: string) => {
              // Ensure confidential fields are NOT queried
              expect(columns).not.toContain("guests");
              expect(columns).not.toContain("vows");
              expect(columns).not.toContain("notes");

              return {
                is: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: [
                        {
                          id: "w-min-1",
                          slug: "wayan-kadek",
                          couple_names: "Wayan & Kadek",
                          location_region: "Gianyar",
                          prospective_date: "2027-05-15",
                          is_frozen: false,
                          created_at: "2026-11-01T00:00:00Z",
                          created_by: "user-1",
                        },
                      ],
                      error: null,
                    }),
                  }),
                }),
              };
            }),
          };
        }
        if (tableName === "access_grants" || tableName === "checkout_orders") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        if (tableName === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "user-1",
                    email: "wayan@bali.id",
                    full_name: "I Wayan Sujana",
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      vi.mocked(createAdminClient).mockReturnValue({
        from: mockFrom,
      } as unknown as ReturnType<typeof createAdminClient>);

      const res = await searchAdminWeddingsAction();
      expect(res.success).toBe(true);
      expect(res.weddings).toHaveLength(1);
      const w = res.weddings[0];
      expect(w.coupleNames).toBe("Wayan & Kadek");
      expect(w.ownerEmail).toBe("wayan@bali.id");

      // Verify guest data is absent from summary
      expect((w as unknown as Record<string, unknown>).guests).toBeUndefined();
      expect(
        (w as unknown as Record<string, unknown>).privateNotes
      ).toBeUndefined();
    });
  });
});
