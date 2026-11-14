import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PRICING_TIERS,
  PRICING_FAQS,
  MVP_WEDDING_PRICE_IDR,
  MVP_WEDDING_ORIGINAL_PRICE_IDR,
} from "../src/features/payments/pricing";
import {
  getWorkspaceEntitlement,
  checkFeatureAccess,
  grantWorkspaceAccessAction,
} from "../src/features/payments/entitlements";
import { sanitizeRedirectPath } from "../src/middleware";

// Mock Supabase Server Client
vi.mock("../src/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("Pricing Models & Feature Capabilities (Issue #35)", () => {
  it("defines transparent one-time pricing for Bali Hindu wedding workspace", () => {
    expect(MVP_WEDDING_PRICE_IDR).toBe(199_000);
    expect(MVP_WEDDING_ORIGINAL_PRICE_IDR).toBe(249_000);
    expect(PRICING_TIERS).toHaveLength(2);

    const [previewTier, fullTier] = PRICING_TIERS;
    expect(previewTier.id).toBe("preview");
    expect(previewTier.price).toBe(0);
    expect(previewTier.priceLabel).toBe("Gratis");

    expect(fullTier.id).toBe("full");
    expect(fullTier.price).toBe(199_000);
    expect(fullTier.popular).toBe(true);
    expect(fullTier.periodLabel).toContain("bayar 1x");
  });

  it("includes clear feature checklist distinguishing Free Preview vs Full Access", () => {
    const [previewTier, fullTier] = PRICING_TIERS;

    // Free Preview allows exploration and offline CSV export
    const previewExport = previewTier.features.find((f) =>
      f.text.includes("Ekspor CSV")
    );
    expect(previewExport?.included).toBe(true);

    const previewInvite = previewTier.features.find((f) =>
      f.text.includes("Undang keluarga")
    );
    expect(previewInvite?.included).toBe(false);

    // Full Access includes complete feature set
    expect(fullTier.features.every((f) => f.included)).toBe(true);
    expect(fullTier.features.some((f) => f.text.includes("15 Anggota"))).toBe(
      true
    );
    expect(
      fullTier.features.some(
        (f) => f.text.includes("Arsip") && f.text.includes("Tetap Aktif")
      )
    ).toBe(true);
  });

  it("provides comprehensive FAQs answering Balinese wedding planning concerns", () => {
    expect(PRICING_FAQS.length).toBeGreaterThanOrEqual(5);

    const questions = PRICING_FAQS.map((q) => q.question.toLowerCase());
    expect(questions.some((q) => q.includes("berlangganan"))).toBe(true);
    expect(questions.some((q) => q.includes("metode pembayaran"))).toBe(true);
    expect(questions.some((q) => q.includes("diundur"))).toBe(true);
    expect(questions.some((q) => q.includes("keluarga"))).toBe(true);
  });
});

describe("Server-Enforced Entitlement Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles Demo sandbox workspace with Free Preview entitlement", async () => {
    const entitlement = await getWorkspaceEntitlement("demo");

    expect(entitlement.weddingId).toBe("demo");
    expect(entitlement.status).toBe("free_preview");
    expect(entitlement.isDemo).toBe(true);
    expect(entitlement.isPaid).toBe(false);
    expect(entitlement.canEdit).toBe(false); // Demo is sandboxed
    expect(entitlement.canInviteMembers).toBe(false);
    expect(entitlement.canExportCSV).toBe(true); // Export allowed
  });

  it("returns Unpaid status with locked mutations for unpaid workspace with no grant", async () => {
    const { createClient } = await import("../src/lib/supabase/server");

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null, // No grant found
                  error: null,
                }),
              }),
            }),
          }),
        }),
      }),
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const entitlement = await getWorkspaceEntitlement("w-unpaid-123");

    expect(entitlement.status).toBe("unpaid");
    expect(entitlement.isPaid).toBe(false);
    expect(entitlement.isDemo).toBe(false);
    expect(entitlement.canEdit).toBe(false); // Locked until paid
    expect(entitlement.canInviteMembers).toBe(false);
    expect(entitlement.canExportCSV).toBe(true);
  });

  it("fails closed with status error when database query fails (Issue #75)", async () => {
    const { createClient } = await import("../src/lib/supabase/server");

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: new Error("Database connection error"),
                }),
              }),
            }),
          }),
        }),
      }),
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const entitlement = await getWorkspaceEntitlement("w-error-123");

    expect(entitlement.status).toBe("error");
    expect(entitlement.isPaid).toBe(false);
    expect(entitlement.canEdit).toBe(false); // Fail closed: no edit permissions on error!
    expect(entitlement.canInviteMembers).toBe(false);
    expect(entitlement.canExportCSV).toBe(true);
  });

  it("grants full access when active grant exists with future validity", async () => {
    const { createClient } = await import("../src/lib/supabase/server");

    // Grant expires 30 days in the future
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "grant-1",
                    status: "active",
                    granted_at: "2026-01-01T00:00:00Z",
                    valid_until: futureDate.toISOString(),
                    revoked_at: null,
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      }),
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const entitlement = await getWorkspaceEntitlement("w-paid-123");

    expect(entitlement.status).toBe("active");
    expect(entitlement.isPaid).toBe(true);
    expect(entitlement.canEdit).toBe(true);
    expect(entitlement.canInviteMembers).toBe(true);
    expect(entitlement.canExportCSV).toBe(true);
    expect(entitlement.daysRemaining).toBeGreaterThanOrEqual(29);
  });

  it("handles graceful read-only archive upon entitlement expiry (PRD 5.4)", async () => {
    const { createClient } = await import("../src/lib/supabase/server");

    // Expired 5 days ago
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "grant-expired",
                    status: "active",
                    granted_at: "2025-01-01T00:00:00Z",
                    valid_until: pastDate.toISOString(),
                    revoked_at: null,
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      }),
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const entitlement = await getWorkspaceEntitlement("w-expired-123");

    expect(entitlement.status).toBe("expired");
    expect(entitlement.isPaid).toBe(false);
    expect(entitlement.canEdit).toBe(false); // Locked for editing
    expect(entitlement.canInviteMembers).toBe(false);
    expect(entitlement.canExportCSV).toBe(true); // Export ALWAYS allowed!
    expect(entitlement.daysRemaining).toBe(0);
    expect(entitlement.planName).toContain("Read-Only");
  });

  it("blocks access when grant is explicitly revoked", async () => {
    const { createClient } = await import("../src/lib/supabase/server");

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "grant-revoked",
                    status: "revoked",
                    granted_at: "2026-01-01T00:00:00Z",
                    valid_until: null,
                    revoked_at: "2026-02-01T00:00:00Z",
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      }),
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const entitlement = await getWorkspaceEntitlement("w-revoked-123");

    expect(entitlement.status).toBe("revoked");
    expect(entitlement.canEdit).toBe(false);
    expect(entitlement.canInviteMembers).toBe(false);
  });
});

describe("Feature Gating Enforcement (checkFeatureAccess)", () => {
  it("enforces gating on member invitations for unpaid workspaces", async () => {
    const { createClient } = await import("../src/lib/supabase/server");

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
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
      }),
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const inviteAccess = await checkFeatureAccess("w-unpaid", "invite");
    expect(inviteAccess.allowed).toBe(false);
    expect(inviteAccess.reason).toContain("Akses Penuh Pawiwahan");

    const exportAccess = await checkFeatureAccess("w-unpaid", "export");
    expect(exportAccess.allowed).toBe(true);
  });

  it("creates access grant properly via grantWorkspaceAccessAction", async () => {
    const { createClient } = await import("../src/lib/supabase/server");
    const mockInsert = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        insert: mockInsert,
      }),
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await grantWorkspaceAccessAction("w-test-paid", {
      orderId: "order-snap-123",
      durationMonths: 12,
    });

    expect(res.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        wedding_id: "w-test-paid",
        order_id: "order-snap-123",
        status: "active",
      })
    );
  });

  describe("Open-Redirect Protection & Safe Path Sanitization (Issue #75)", () => {
    it("allows valid relative internal paths starting with single slash", () => {
      expect(sanitizeRedirectPath("/workspaces")).toBe("/workspaces");
      expect(sanitizeRedirectPath("/workspace/123/budget")).toBe(
        "/workspace/123/budget"
      );
      expect(sanitizeRedirectPath("/profile?tab=security")).toBe(
        "/profile?tab=security"
      );
    });

    it("rejects absolute external URLs and protocol handlers (open redirect defense)", () => {
      expect(sanitizeRedirectPath("https://evil.com")).toBe("/workspaces");
      expect(sanitizeRedirectPath("http://attacker.org/phishing")).toBe(
        "/workspaces"
      );
      expect(sanitizeRedirectPath("javascript:alert(1)")).toBe("/workspaces");
    });

    it("rejects protocol-relative double slash and backslash tricks", () => {
      expect(sanitizeRedirectPath("//evil.com")).toBe("/workspaces");
      expect(sanitizeRedirectPath("/\\evil.com")).toBe("/workspaces");
      expect(sanitizeRedirectPath("///malicious.net")).toBe("/workspaces");
    });

    it("uses custom fallback if provided when rejecting malicious paths", () => {
      expect(
        sanitizeRedirectPath("https://evil.com", "/workspace/default-1")
      ).toBe("/workspace/default-1");
    });
  });
});
