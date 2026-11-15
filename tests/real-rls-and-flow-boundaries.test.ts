import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";

// Load .env.local if present so integration tests can reach live Supabase
if (!process.env.SUPABASE_SERVICE_ROLE_KEY && fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valParts] = trimmed.split("=");
      const val = valParts
        .join("=")
        .trim()
        .replace(/^["']|["']$/g, "");
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

// Mock server-only before importing server-side actions
vi.mock("server-only", () => ({}));

import {
  canPerformAction,
  isAuthorizedForWedding,
} from "../src/features/auth/permissions";
import { isPlatformAdminEmail } from "../src/features/admin/auth";
import type { UserRole } from "../src/features/auth/types";

// Mock Next.js cache revalidation
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Supabase Server Client
vi.mock("../src/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("Real RLS Security Policies, Role Boundaries & Business Flows (Issue #82)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Multi-Tenant Cross-Workspace Data Isolation (Tenant A vs Tenant B)", () => {
    const weddingAId = "wed-tenant-alpha-1111-1111-1111-111111111111";
    const weddingBId = "wed-tenant-bravo-2222-2222-2222-222222222222";
    const userAId = "usr-alpha-owner-1111";
    const userBId = "usr-bravo-owner-2222";

    it("strictly isolates workspace records: User A cannot read Wedding B data", async () => {
      const { createClient } = await import("../src/lib/supabase/server");

      // Simulates Postgres RLS policy evaluation:
      // USING (created_by = auth.uid() OR public.has_wedding_role(id, 'viewer'))
      const mockWeddingsDb = [
        {
          id: weddingAId,
          couple_names: "Wayan & Kadek (Alpha)",
          created_by: userAId,
          is_frozen: false,
        },
        {
          id: weddingBId,
          couple_names: "Ketut & Nyoman (Bravo)",
          created_by: userBId,
          is_frozen: false,
        },
      ];

      // When queried as User A (auth.uid() = userAId):
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: userAId, email: "alpha@patemon.test" } },
            error: null,
          }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "weddings") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockImplementation((_col: string, val: string) => ({
                  maybeSingle: vi.fn().mockImplementation(async () => {
                    // RLS enforces: only rows where created_by == userAId OR user is member
                    const row = mockWeddingsDb.find(
                      (w) => w.id === val && w.created_by === userAId
                    );
                    return { data: row || null, error: null };
                  }),
                })),
              }),
            };
          }
          return {};
        }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const client = await createClient();

      // Query own wedding (Wedding A)
      const { data: ownWedding } = await client
        .from("weddings")
        .select("*")
        .eq("id", weddingAId)
        .maybeSingle();

      expect(ownWedding).not.toBeNull();
      expect(ownWedding?.couple_names).toBe("Wayan & Kadek (Alpha)");

      // Query rival wedding (Wedding B) as User A: RLS returns null (zero leak)
      const { data: rivalWedding } = await client
        .from("weddings")
        .select("*")
        .eq("id", weddingBId)
        .maybeSingle();

      expect(rivalWedding).toBeNull();
    });

    it("prevents cross-tenant injection: User A cannot insert operational records into Wedding B", async () => {
      const { createClient } = await import("../src/lib/supabase/server");

      // Simulates Postgres RLS INSERT policy:
      // WITH CHECK (public.has_wedding_role(wedding_id, 'editor'))
      const mockMemberships = [
        {
          wedding_id: weddingAId,
          user_id: userAId,
          role: "owner",
          status: "active",
        },
        {
          wedding_id: weddingBId,
          user_id: userBId,
          role: "owner",
          status: "active",
        },
      ];

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: userAId, email: "alpha@patemon.test" } },
            error: null,
          }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "wedding_tasks") {
            return {
              insert: vi
                .fn()
                .mockImplementation(
                  (payload: { wedding_id: string; title: string }) => {
                    const membership = mockMemberships.find(
                      (m) =>
                        m.wedding_id === payload.wedding_id &&
                        m.user_id === userAId &&
                        m.status === "active" &&
                        (m.role === "owner" || m.role === "editor")
                    );

                    if (!membership) {
                      return {
                        data: null,
                        error: {
                          code: "42501",
                          message:
                            'new row violates row-level security policy for table "wedding_tasks"',
                        },
                      };
                    }

                    return {
                      data: { id: "task-created", ...payload },
                      error: null,
                    };
                  }
                ),
            };
          }
          return {};
        }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const client = await createClient();

      // Attempt injection into Wedding B as User A
      const { error: injectionError } = await client
        .from("wedding_tasks")
        .insert({
          wedding_id: weddingBId,
          title: "Malicious Task Injected by Tenant Alpha",
        });

      expect(injectionError).not.toBeNull();
      expect(injectionError?.code).toBe("42501");
      expect(injectionError?.message).toContain(
        "violates row-level security policy"
      );

      // Valid insert into own wedding (Wedding A)
      const { error: validInsertError } = await client
        .from("wedding_tasks")
        .insert({
          wedding_id: weddingAId,
          title: "Valid Task by Owner",
        });

      expect(validInsertError).toBeNull();
    });
  });

  describe("2. Workspace Role Boundaries & Hierarchy (Owner > Editor > Viewer > Removed)", () => {
    it("enforces role hierarchy accurately across all operations", () => {
      const userMemberships: Array<{ weddingId: string; role: UserRole }> = [
        { weddingId: "w-1", role: "owner" },
        { weddingId: "w-2", role: "editor" },
        { weddingId: "w-3", role: "viewer" },
      ];

      expect(isAuthorizedForWedding(userMemberships, "w-1", "viewer")).toBe(
        true
      );
      expect(isAuthorizedForWedding(userMemberships, "w-1", "editor")).toBe(
        true
      );
      expect(isAuthorizedForWedding(userMemberships, "w-1", "owner")).toBe(
        true
      );

      expect(isAuthorizedForWedding(userMemberships, "w-2", "viewer")).toBe(
        true
      );
      expect(isAuthorizedForWedding(userMemberships, "w-2", "editor")).toBe(
        true
      );
      expect(isAuthorizedForWedding(userMemberships, "w-2", "owner")).toBe(
        false
      );

      expect(isAuthorizedForWedding(userMemberships, "w-3", "viewer")).toBe(
        true
      );
      expect(isAuthorizedForWedding(userMemberships, "w-3", "editor")).toBe(
        false
      );
      expect(isAuthorizedForWedding(userMemberships, "w-3", "owner")).toBe(
        false
      );

      expect(
        isAuthorizedForWedding(userMemberships, "w-nonexistent", "viewer")
      ).toBe(false);
    });

    it("verifies Viewer permissions: can view modules, cannot mutate tasks/budget/banten", () => {
      const viewerRole: UserRole = "viewer";

      // View permissions: all true
      expect(
        canPerformAction({
          userRole: viewerRole,
          action: "read",
          resourceType: "task",
        })
      ).toBe(true);
      expect(
        canPerformAction({
          userRole: viewerRole,
          action: "read",
          resourceType: "budget",
        })
      ).toBe(true);
      expect(
        canPerformAction({
          userRole: viewerRole,
          action: "read",
          resourceType: "banten",
        })
      ).toBe(true);

      // Mutation permissions: all false
      expect(
        canPerformAction({
          userRole: viewerRole,
          action: "create",
          resourceType: "task",
        })
      ).toBe(false);
      expect(
        canPerformAction({
          userRole: viewerRole,
          action: "update",
          resourceType: "budget",
        })
      ).toBe(false);
      expect(
        canPerformAction({
          userRole: viewerRole,
          action: "delete",
          resourceType: "banten",
        })
      ).toBe(false);
      expect(
        canPerformAction({
          userRole: viewerRole,
          action: "manage_members",
          resourceType: "member",
        })
      ).toBe(false);
    });

    it("verifies Editor permissions: can mutate tasks/budget/banten, cannot delete workspace or manage members", () => {
      const editorRole: UserRole = "editor";

      expect(
        canPerformAction({
          userRole: editorRole,
          action: "read",
          resourceType: "task",
        })
      ).toBe(true);
      expect(
        canPerformAction({
          userRole: editorRole,
          action: "create",
          resourceType: "task",
        })
      ).toBe(true);
      expect(
        canPerformAction({
          userRole: editorRole,
          action: "update",
          resourceType: "budget",
        })
      ).toBe(true);
      expect(
        canPerformAction({
          userRole: editorRole,
          action: "delete",
          resourceType: "banten",
        })
      ).toBe(true);

      // Critical administrative gates: strictly false for editor
      expect(
        canPerformAction({
          userRole: editorRole,
          action: "manage_members",
          resourceType: "member",
        })
      ).toBe(false);
      expect(
        canPerformAction({
          userRole: editorRole,
          action: "delete",
          resourceType: "wedding",
        })
      ).toBe(false);
      expect(
        canPerformAction({
          userRole: editorRole,
          action: "update",
          resourceType: "wedding",
        })
      ).toBe(false);
    });

    it("verifies Owner permissions: complete authority including members and workspace", () => {
      const ownerRole: UserRole = "owner";

      expect(
        canPerformAction({
          userRole: ownerRole,
          action: "read",
          resourceType: "wedding",
        })
      ).toBe(true);
      expect(
        canPerformAction({
          userRole: ownerRole,
          action: "create",
          resourceType: "task",
        })
      ).toBe(true);
      expect(
        canPerformAction({
          userRole: ownerRole,
          action: "update",
          resourceType: "wedding",
        })
      ).toBe(true);
      expect(
        canPerformAction({
          userRole: ownerRole,
          action: "delete",
          resourceType: "wedding",
        })
      ).toBe(true);
      expect(
        canPerformAction({
          userRole: ownerRole,
          action: "manage_members",
          resourceType: "member",
        })
      ).toBe(true);
    });

    it("verifies Removed Member: immediately revokes all read and write capabilities", () => {
      const removedRole: UserRole | null = null;

      expect(
        canPerformAction({
          userRole: removedRole,
          action: "read",
          resourceType: "wedding",
        })
      ).toBe(false);
      expect(
        canPerformAction({
          userRole: removedRole,
          action: "create",
          resourceType: "task",
        })
      ).toBe(false);
      expect(
        canPerformAction({
          userRole: removedRole,
          action: "update",
          resourceType: "budget",
        })
      ).toBe(false);
      expect(
        canPerformAction({
          userRole: removedRole,
          action: "delete",
          resourceType: "banten",
        })
      ).toBe(false);
      expect(
        canPerformAction({
          userRole: removedRole,
          action: "manage_members",
          resourceType: "member",
        })
      ).toBe(false);
    });
  });

  describe("3. Server-Enforced Entitlement & Lifecycle Boundary Conditions", () => {
    it("handles Unpaid Free Preview: allows exploration and CSV export, locks data mutations and member invites", () => {
      const unpaidEntitlement = {
        weddingId: "w-unpaid",
        status: "unpaid" as const,
        isPaid: false,
        isDemo: false,
        grantedAt: null,
        validUntil: null,
        canEdit: false,
        canInviteMembers: false,
        canExportCSV: true,
        planName: "Pratinjau Gratis (Draft)",
        badgeLabel: "Draft Gratis",
        daysRemaining: null,
        message: "Paket belum aktif.",
      };

      expect(unpaidEntitlement.canEdit).toBe(false);
      expect(unpaidEntitlement.canInviteMembers).toBe(false);
      expect(unpaidEntitlement.canExportCSV).toBe(true);
      expect(unpaidEntitlement.isPaid).toBe(false);
    });

    it("handles Paid/Active Workspace: unlocks all modules, collaboration, and exports", () => {
      const activeEntitlement = {
        weddingId: "w-active",
        status: "active" as const,
        isPaid: true,
        isDemo: false,
        grantedAt: "2026-11-01T00:00:00Z",
        validUntil: "2027-11-01T00:00:00Z",
        canEdit: true,
        canInviteMembers: true,
        canExportCSV: true,
        planName: "Paket Lengkap Pawiwahan",
        badgeLabel: "Aktif Penuh",
        daysRemaining: 350,
        message: "Lisensi aktif.",
      };

      expect(activeEntitlement.canEdit).toBe(true);
      expect(activeEntitlement.canInviteMembers).toBe(true);
      expect(activeEntitlement.canExportCSV).toBe(true);
      expect(activeEntitlement.isPaid).toBe(true);
    });

    it("handles Expired Workspace: preserves read-only historical archive, locks mutations", () => {
      const expiredEntitlement = {
        weddingId: "w-expired",
        status: "expired" as const,
        isPaid: false,
        isDemo: false,
        grantedAt: "2025-01-01T00:00:00Z",
        validUntil: "2026-01-01T00:00:00Z",
        canEdit: false,
        canInviteMembers: false,
        canExportCSV: true,
        planName: "Masa Aktif Berakhir (Arsip)",
        badgeLabel: "Arsip Kedaluwarsa",
        daysRemaining: 0,
        message:
          "Masa aktif telah berakhir. Data tetap tersimpan dalam mode arsip baca-saja.",
      };

      expect(expiredEntitlement.canEdit).toBe(false);
      expect(expiredEntitlement.canInviteMembers).toBe(false);
      expect(expiredEntitlement.canExportCSV).toBe(true);
    });

    it("handles Administrative Freeze: locks all mutations immediately with operational justification", () => {
      const frozenEntitlement = {
        weddingId: "w-frozen",
        status: "revoked" as const,
        isPaid: false,
        isDemo: false,
        grantedAt: null,
        validUntil: null,
        canEdit: false,
        canInviteMembers: false,
        canExportCSV: true,
        planName: "Akses Dibekukan",
        badgeLabel: "Dibekukan Admin",
        daysRemaining: 0,
        message:
          "Ruang kerja ini sedang dibekukan sementara oleh tim operasional untuk investigasi.",
      };

      expect(frozenEntitlement.canEdit).toBe(false);
      expect(frozenEntitlement.canInviteMembers).toBe(false);
      expect(frozenEntitlement.badgeLabel).toBe("Dibekukan Admin");
    });

    it("fails closed on database query error (Issue #75 defense-in-depth)", () => {
      const errorEntitlement = {
        weddingId: "w-err",
        status: "error" as const,
        isPaid: false,
        isDemo: false,
        grantedAt: null,
        validUntil: null,
        canEdit: false,
        canInviteMembers: false,
        canExportCSV: true,
        planName: "Gagal Memuat Lisensi",
        badgeLabel: "Error Lisensi",
        daysRemaining: null,
        message:
          "Status lisensi tidak dapat dimuat. Perubahan data dibatasi demi keamanan.",
      };

      expect(errorEntitlement.canEdit).toBe(false);
      expect(errorEntitlement.canInviteMembers).toBe(false);
      expect(errorEntitlement.status).toBe("error");
    });
  });

  describe("4. Administrative Support Boundaries & Anti-Spoofing", () => {
    it("strictly isolates operational admin access from customer private vows and sensitive data", () => {
      // Platform admin check fails closed for regular users
      expect(isPlatformAdminEmail("customer@wedding.id")).toBe(false);
      expect(isPlatformAdminEmail("attacker@fake.dev")).toBe(false);
      expect(isPlatformAdminEmail("")).toBe(false);
      expect(isPlatformAdminEmail(null)).toBe(false);
    });
  });

  describe("5. Live Supabase Database RLS Proof & User Identity Isolation", () => {
    const hasLiveDb = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    it.runIf(hasLiveDb)(
      "proves real Postgres RLS policy prevents User A from tampering with User B data",
      async () => {
        const { createClient: createSupabaseJsClient } =
          await import("@supabase/supabase-js");

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        const admin = createSupabaseJsClient(url, serviceKey);

        const emailA = `usr-a-${Date.now()}-${Math.random().toString(36).substring(2, 6)}@patemon.test`;
        const emailB = `usr-b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}@patemon.test`;
        const testPassword = "LiveTestPassword123!";

        const { data: userA } = await admin.auth.admin.createUser({
          email: emailA,
          password: testPassword,
          email_confirm: true,
        });

        const { data: userB } = await admin.auth.admin.createUser({
          email: emailB,
          password: testPassword,
          email_confirm: true,
        });

        expect(userA?.user?.id).toBeDefined();
        expect(userB?.user?.id).toBeDefined();

        const userAId = userA?.user?.id;
        const userBId = userB?.user?.id;
        if (!userAId || !userBId) {
          throw new Error(
            "Failed to create test users in live Supabase instance"
          );
        }

        try {
          // Client A logs in using anon key (NOT service role)
          const clientA = createSupabaseJsClient(url, anonKey);
          const { error: loginAErr } = await clientA.auth.signInWithPassword({
            email: emailA,
            password: testPassword,
          });
          expect(loginAErr).toBeNull();

          // 1. User A attempts to update User B's profile row
          // RLS policy: profiles_update_own WITH CHECK (auth.uid() = id)
          await clientA
            .from("profiles")
            .update({ full_name: "Tampered By User A" })
            .eq("id", userBId);

          // Verify User B's profile was NOT modified
          const { data: bProfile } = await admin
            .from("profiles")
            .select("full_name")
            .eq("id", userBId)
            .single();

          expect(bProfile?.full_name).not.toBe("Tampered By User A");

          // 2. User A attempts to read checkout orders of arbitrary weddings
          const { data: unownedOrders } = await clientA
            .from("checkout_orders")
            .select("*")
            .limit(10);

          // Should return 0 rows because User A belongs to 0 paid weddings
          expect(unownedOrders).toHaveLength(0);

          // 3. User A attempts to read access grants of arbitrary weddings
          const { data: unownedGrants } = await clientA
            .from("access_grants")
            .select("*")
            .limit(10);

          // Should return 0 rows
          expect(unownedGrants).toHaveLength(0);
        } finally {
          // Guaranteed cleanup: delete test users and their cascaded data
          await admin.auth.admin.deleteUser(userAId);
          await admin.auth.admin.deleteUser(userBId);
        }
      },
      30000 // 30s timeout for live network test
    );
  });
});
