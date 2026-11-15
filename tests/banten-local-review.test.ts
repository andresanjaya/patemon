import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  submitBantenReviewAction,
  updateBantenItemAction,
  updateBantenStatusAction,
  getWeddingBantenItems,
  verifyBantenWritePermission,
} from "../src/features/banten/actions";
import { DEFAULT_RITUAL_CATALOG } from "../src/features/banten/seeds";
import type {
  BantenReviewStatus,
  SubmitBantenReviewInput,
} from "../src/features/banten/types";

// Mock Supabase Server Client
vi.mock("../src/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock Next.js revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Entitlement engine
vi.mock("../src/features/payments/entitlements", () => ({
  checkFeatureAccess: vi.fn().mockResolvedValue({ allowed: true }),
}));

// Mock Activity Logs
vi.mock("../src/features/activity-logs/actions", () => ({
  recordActivityLogAction: vi.fn().mockResolvedValue({ success: true }),
}));

describe("[PATEMON][MVP2] Tinjauan Kebutuhan Banten oleh Keluarga & Praktisi Setempat (Issue #91)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Review Status States & Balinese Cultural Practitioners", () => {
    it("supports all 4 review status states (approved, needs_review, needs_revision, draft)", () => {
      const validStatuses: BantenReviewStatus[] = [
        "draft",
        "needs_review",
        "needs_revision",
        "approved",
      ];
      expect(validStatuses).toHaveLength(4);
      expect(validStatuses).toContain("approved");
      expect(validStatuses).toContain("needs_review");
      expect(validStatuses).toContain("needs_revision");
      expect(validStatuses).toContain("draft");
    });

    it("allows recording reviews by external practitioners (Jero Mangku / Serati) with transparent attribution", async () => {
      const { createClient } = await import("../src/lib/supabase/server");

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "user-editor-1",
                email: "editor@patemon.test",
                user_metadata: { full_name: "I Putu Dharma Yoga" },
              },
            },
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "wedding_members") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { role: "editor", status: "active" },
              }),
            };
          }
          if (table === "profiles") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  full_name: "I Putu Dharma Yoga",
                  email: "editor@patemon.test",
                },
              }),
            };
          }
          if (table === "wedding_ritual_items") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              is: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "item-banten-101",
                  name: "Banten Pejati Lengkap",
                  review_status: "needs_review",
                  ceremony_id: "ceremony-1",
                },
                error: null,
              }),
              update: vi.fn().mockReturnThis(),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          };
        }),
      };

      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase
      );

      const reviewInput: SubmitBantenReviewInput = {
        reviewStatus: "approved",
        reviewerName: "Jero Mangku Griya Sanur",
        reviewerType: "external_practitioner",
        reviewNotes:
          "Telah disetujui sesuai dresta Griya Sanur, sanggah cucuk dan ayam brumbun lengkap.",
        sourceReference: "Dresta Griya Sanur & Pedoman PHDI",
      };

      const result = await submitBantenReviewAction(
        "wed-denpasar-1",
        "item-banten-101",
        reviewInput
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain("berhasil disimpan");

      // Verify that the update method was called on wedding_ritual_items
      const ritualUpdateCall = mockSupabase.from.mock.results.find(
        (r) => r.value?.update
      );
      expect(ritualUpdateCall).toBeDefined();
    });

    it("supports reviews by internal family members / panitia", async () => {
      const { createClient } = await import("../src/lib/supabase/server");

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "user-owner-1",
                email: "owner@patemon.test",
                user_metadata: { full_name: "Ida Bagus Made" },
              },
            },
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "wedding_members") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { role: "owner", status: "active" },
              }),
            };
          }
          if (table === "profiles") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  full_name: "Ida Bagus Made",
                  email: "owner@patemon.test",
                },
              }),
            };
          }
          if (table === "wedding_ritual_items") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              is: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "item-banten-102",
                  name: "Banten Pulagembal",
                  review_status: "needs_review",
                  ceremony_id: null,
                },
                error: null,
              }),
              update: vi.fn().mockReturnThis(),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          };
        }),
      };

      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase
      );

      const reviewInput: SubmitBantenReviewInput = {
        reviewStatus: "needs_revision",
        reviewerName: "Ida Ayu Ketut (Tetua Griya)",
        reviewerType: "internal_member",
        reviewNotes:
          "Perlu ditambahkan tumpeng 7 tanding sesuai kebiasaan keluarga.",
        sourceReference: "Dresta Adat Keluarga Griya",
      };

      const result = await submitBantenReviewAction(
        "wed-denpasar-1",
        "item-banten-102",
        reviewInput
      );
      expect(result.success).toBe(true);
    });

    it("rejects empty reviewer name", async () => {
      const result = await submitBantenReviewAction(
        "wed-denpasar-1",
        "item-banten-101",
        {
          reviewStatus: "approved",
          reviewerName: "   ",
          reviewerType: "external_practitioner",
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain(
        "Nama peninjau atau praktisi adat wajib diisi"
      );
    });
  });

  describe("2. Wedding Scoping & Catalog Immutability (Anti-Universalization)", () => {
    it("guarantees local wedding reviews never alter canonical ritual catalog items", async () => {
      const initialCatalogSnapshot = JSON.parse(
        JSON.stringify(DEFAULT_RITUAL_CATALOG)
      );

      // Execute review in demo mode
      const result = await submitBantenReviewAction("demo", "demo-banten-1", {
        reviewStatus: "approved",
        reviewerName: "Jero Mangku Griya Sanur",
        reviewerType: "external_practitioner",
        reviewNotes: "Keputusan lokal khusus keluarga ini",
      });

      expect(result.success).toBe(true);

      // Verify global catalog remains completely pristine and unmodified
      expect(DEFAULT_RITUAL_CATALOG).toEqual(initialCatalogSnapshot);
      DEFAULT_RITUAL_CATALOG.forEach((item) => {
        const record = item as unknown as Record<string, unknown>;
        expect(record.reviewStatus).toBeUndefined();
        expect(record.reviewerName).toBeUndefined();
      });
    });

    it("enforces multi-tenant boundaries: cannot review an item belonging to another wedding", async () => {
      const { createClient } = await import("../src/lib/supabase/server");

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "user-editor-1",
                email: "editor@patemon.test",
                user_metadata: { full_name: "Editor Yoga" },
              },
            },
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "wedding_members") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { role: "editor", status: "active" },
              }),
            };
          }
          if (table === "profiles") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  full_name: "Editor Yoga",
                  email: "editor@patemon.test",
                },
              }),
            };
          }
          if (table === "wedding_ritual_items") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              is: vi.fn().mockReturnThis(),
              // Simulating item NOT found under wedding A because it belongs to wedding B
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          };
        }),
      };

      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase
      );

      const result = await submitBantenReviewAction(
        "wedding-A",
        "foreign-item-from-wedding-B",
        {
          reviewStatus: "approved",
          reviewerName: "Jero Mangku",
          reviewerType: "external_practitioner",
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain(
        "Item banten tidak ditemukan pada ruang kerja ini"
      );
    });
  });

  describe("3. Separation of Procurement Logistics vs Adat Review Consensus", () => {
    it("updating acquisition status (procurement) does NOT reset review status", async () => {
      const { createClient } = await import("../src/lib/supabase/server");

      let updatedFields: Record<string, unknown> = {};

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "user-editor-1",
                email: "editor@patemon.test",
                user_metadata: { full_name: "Editor Yoga" },
              },
            },
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "wedding_members") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { role: "editor", status: "active" },
              }),
            };
          }
          if (table === "wedding_ritual_items") {
            return {
              update: vi.fn((payload) => {
                updatedFields = payload;
                return {
                  eq: vi.fn().mockReturnThis(),
                };
              }),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          };
        }),
      };

      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase
      );

      const result = await updateBantenStatusAction(
        "wed-1",
        "banten-101",
        "ready"
      );

      expect(result.success).toBe(true);
      expect(updatedFields.status).toBe("ready");
      // Acquisition status update does NOT touch review_status
      expect(updatedFields.review_status).toBeUndefined();
    });
  });

  describe("4. Automatic Re-Review Trigger on Specification Modification", () => {
    it("automatically resets an approved banten item to 'needs_review' if core specifications change", async () => {
      const { createClient } = await import("../src/lib/supabase/server");

      let updatedPayload: Record<string, unknown> = {};

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "user-editor-1",
                email: "editor@patemon.test",
                user_metadata: { full_name: "I Putu Dharma Yoga" },
              },
            },
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "wedding_members") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { role: "editor", status: "active" },
              }),
            };
          }
          if (table === "profiles") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  full_name: "I Putu Dharma Yoga",
                  email: "editor@patemon.test",
                },
              }),
            };
          }
          if (table === "wedding_ritual_items") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              is: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "item-banten-101",
                  name: "Banten Pejati Lengkap",
                  category: "madya",
                  quantity: 4,
                  unit: "Tanding",
                  sourcing_method: "self_made",
                  status: "making",
                  review_status: "approved", // Previously approved!
                  review_notes: "Disetujui 4 tanding untuk merajan dan lebuh.",
                  ceremony_id: "ceremony-1",
                },
                error: null,
              }),
              update: vi.fn((payload) => {
                updatedPayload = payload;
                return {
                  eq: vi.fn().mockReturnThis(),
                };
              }),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          };
        }),
      };

      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase
      );

      // User changes quantity from 4 to 6
      const result = await updateBantenItemAction("wed-1", "item-banten-101", {
        name: "Banten Pejati Lengkap",
        category: "madya",
        quantity: 6, // CHANGED from 4 to 6!
        unit: "Tanding",
        sourcingMethod: "self_made",
        status: "making",
        ceremonyId: "ceremony-1",
        estimatedPrice: 600000,
        actualPrice: 400000,
        notes: "Ditambah 2 tanding untuk sanggah surya.",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("Perlu Ditinjau");

      // Verify that review_status was automatically reset to 'needs_review'
      expect(updatedPayload.review_status).toBe("needs_review");
      expect(updatedPayload.review_notes).toContain("[Perlu Tinjauan Ulang]");
      expect(updatedPayload.review_notes).toContain("I Putu Dharma Yoga");
    });

    it("retains 'approved' review status if only non-specification fields (e.g. actual price) change", async () => {
      const { createClient } = await import("../src/lib/supabase/server");

      let updatedPayload: Record<string, unknown> = {};

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "user-editor-1",
                email: "editor@patemon.test",
                user_metadata: { full_name: "I Putu Dharma Yoga" },
              },
            },
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "wedding_members") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { role: "editor", status: "active" },
              }),
            };
          }
          if (table === "profiles") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  full_name: "I Putu Dharma Yoga",
                  email: "editor@patemon.test",
                },
              }),
            };
          }
          if (table === "wedding_ritual_items") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              is: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "item-banten-101",
                  name: "Banten Pejati Lengkap",
                  category: "madya",
                  quantity: 4,
                  unit: "Tanding",
                  sourcing_method: "self_made",
                  status: "making",
                  review_status: "approved",
                  review_notes: "Disetujui 4 tanding.",
                  ceremony_id: "ceremony-1",
                  notes: "Catatan tetap.",
                },
                error: null,
              }),
              update: vi.fn((payload) => {
                updatedPayload = payload;
                return {
                  eq: vi.fn().mockReturnThis(),
                };
              }),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          };
        }),
      };

      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase
      );

      // Specifications did NOT change, only actualPrice updated from 0 to 450000
      const result = await updateBantenItemAction("wed-1", "item-banten-101", {
        name: "Banten Pejati Lengkap",
        category: "madya",
        quantity: 4,
        unit: "Tanding",
        sourcingMethod: "self_made",
        status: "making",
        ceremonyId: "ceremony-1",
        estimatedPrice: 400000,
        actualPrice: 450000, // Non-spec financial field
        notes: "Catatan tetap.",
      });

      expect(result.success).toBe(true);
      // review_status stays approved
      expect(updatedPayload.review_status).toBe("approved");
      expect(updatedPayload.review_notes).toBe("Disetujui 4 tanding.");
    });
  });

  describe("5. Fail-Closed RBAC & Viewer Protection", () => {
    it("strictly rejects review submissions by role 'viewer'", async () => {
      const { createClient } = await import("../src/lib/supabase/server");

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "user-viewer-1",
                email: "viewer@patemon.test",
              },
            },
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "wedding_members") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { role: "viewer", status: "active" }, // VIEWER ROLE
              }),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          };
        }),
      };

      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase
      );

      const result = await submitBantenReviewAction("wed-1", "item-1", {
        reviewStatus: "approved",
        reviewerName: "Jero Mangku",
        reviewerType: "external_practitioner",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain(
        "Akses ditolak: Peran Anda hanya memiliki hak baca (Viewer)"
      );
    });

    it("rejects mutations by unauthenticated users", async () => {
      const { createClient } = await import("../src/lib/supabase/server");

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
          }),
        },
      };

      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSupabase
      );

      const perm = await verifyBantenWritePermission("wed-1");
      expect(perm.allowed).toBe(false);
      expect(perm.error).toContain("Autentikasi diperlukan");
    });
  });

  describe("6. Demo Mode Reliability", () => {
    it("returns pre-seeded authentic review data in demo mode", async () => {
      const items = await getWeddingBantenItems("demo");

      expect(items.length).toBeGreaterThanOrEqual(5);

      const approvedItems = items.filter((i) => i.reviewStatus === "approved");
      expect(approvedItems.length).toBeGreaterThan(0);

      // Confirm demo items have authentic Balinese practitioner annotations
      const pejatiItem = items.find((i) => i.name.includes("Pejati"));
      expect(pejatiItem).toBeDefined();
      expect(pejatiItem?.reviewerName).toBe("Jero Mangku Griya Sanur");
      expect(pejatiItem?.reviewerType).toBe("external_practitioner");
      expect(pejatiItem?.recordedByName).toContain("Dicatat oleh");
      expect(pejatiItem?.reviewedAt).toBeDefined();

      const revisionItem = items.find(
        (i) => i.reviewStatus === "needs_revision"
      );
      expect(revisionItem).toBeDefined();
      expect(revisionItem?.reviewerName).toBe("Ida Bagus Made (Ketua Panitia)");
      expect(revisionItem?.reviewerType).toBe("internal_member");
    });
  });
});
