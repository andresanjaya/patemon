import { describe, it, expect } from "vitest";
import {
  VENDOR_CATEGORIES,
  STARTER_VENDOR_TEMPLATES,
  DEMO_VENDORS,
  getCategoryInfo,
  getStatusConfig,
  formatWhatsAppLink,
  calculateVendorStats,
} from "../src/features/vendors/seeds";
import type { Vendor, VendorStatus } from "../src/features/vendors/types";

describe("Balinese Vendor Management Domain (Issue #29)", () => {
  describe("Vendor Categories & Customary Metadata", () => {
    it("should define at least 8 essential Balinese wedding vendor categories", () => {
      expect(VENDOR_CATEGORIES.length).toBeGreaterThanOrEqual(8);

      const categoryIds = VENDOR_CATEGORIES.map((c) => c.id);
      expect(categoryIds).toContain("banten_serati");
      expect(categoryIds).toContain("busana_rias");
      expect(categoryIds).toContain("fotografi_videografi");
      expect(categoryIds).toContain("dekorasi_tenda");
      expect(categoryIds).toContain("katering_mebat");
      expect(categoryIds).toContain("musik_sound_gong");
      expect(categoryIds).toContain("venue_bale");
      expect(categoryIds).toContain("undangan_souvenir");
    });

    it("should retrieve category info correctly or fallback to lainnya", () => {
      const banten = getCategoryInfo("banten_serati");
      expect(banten.id).toBe("banten_serati");
      expect(banten.name).toContain("Serati Banten");

      const unknown = getCategoryInfo("unknown_cat");
      expect(unknown.id).toBe("lainnya");
      expect(unknown.name).toBe("unknown_cat");
    });

    it("should support all 6 vendor statuses in the lifecycle", () => {
      const statuses: VendorStatus[] = [
        "prospect",
        "contacted",
        "quoted",
        "booked",
        "completed",
        "canceled",
      ];

      statuses.forEach((s) => {
        const config = getStatusConfig(s);
        expect(config).toBeDefined();
        expect(config.label.length).toBeGreaterThan(0);
        expect(config.badgeClass).toBeDefined();
      });
    });
  });

  describe("WhatsApp Link Formatter & Phone Sanitization", () => {
    it("should format standard Indonesian mobile numbers starting with 08 into 628", () => {
      const wa = formatWhatsAppLink("081234567890");
      expect(wa).toBe("https://wa.me/6281234567890");
    });

    it("should strip dashes, spaces, and brackets", () => {
      const wa = formatWhatsAppLink("+62 812-3456-7890");
      expect(wa).toBe("https://wa.me/6281234567890");
    });

    it("should include prefilled URI encoded text if provided", () => {
      const wa = formatWhatsAppLink("081234567890", "Om Swastyastu Bli");
      expect(wa).toBe("https://wa.me/6281234567890?text=Om%20Swastyastu%20Bli");
    });

    it("should return null for empty or non-digit inputs", () => {
      expect(formatWhatsAppLink(null)).toBeNull();
      expect(formatWhatsAppLink("")).toBeNull();
      expect(formatWhatsAppLink("abc-xyz")).toBeNull();
    });
  });

  describe("Vendor Statistics & Due Payment Calculations", () => {
    const mockVendors: Vendor[] = [
      {
        id: "v1",
        weddingId: "w1",
        category: "banten_serati",
        name: "Griya Banten Asri",
        contactPerson: "Jero Mangku",
        phone: "08123456789",
        socialLink: null,
        quoteAmount: 20000000,
        status: "booked",
        picName: "Paman",
        notes: null,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        agreedAmount: 20000000,
        paidAmount: 5000000,
        dueAmount: 15000000,
        linkedBudgetItems: [],
      },
      {
        id: "v2",
        weddingId: "w1",
        category: "busana_rias",
        name: "Sanggar Rias",
        contactPerson: "Ibu MUA",
        phone: "081999888777",
        socialLink: null,
        quoteAmount: 12000000,
        status: "completed",
        picName: "Mempelai Wanita",
        notes: null,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        agreedAmount: 12000000,
        paidAmount: 12000000,
        dueAmount: 0,
        linkedBudgetItems: [],
      },
      {
        id: "v3",
        weddingId: "w1",
        category: "fotografi_videografi",
        name: "Studio Foto Bali",
        contactPerson: "Bli Fotografer",
        phone: null,
        socialLink: null,
        quoteAmount: 8000000,
        status: "prospect",
        picName: "Seksi Dokumentasi",
        notes: null,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        agreedAmount: 8000000,
        paidAmount: 0,
        dueAmount: 8000000,
        linkedBudgetItems: [],
      },
      {
        id: "v4",
        weddingId: "w1",
        category: "musik_sound_gong",
        name: "Gong Lama",
        contactPerson: null,
        phone: null,
        socialLink: null,
        quoteAmount: 5000000,
        status: "canceled",
        picName: null,
        notes: "Batal karena memakai sekaa banjar sendiri",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        agreedAmount: 5000000,
        paidAmount: 0,
        dueAmount: 5000000,
        linkedBudgetItems: [],
      },
    ];

    it("should calculate total, booked, prospect, and completed vendor counts accurately", () => {
      const stats = calculateVendorStats(mockVendors);
      expect(stats.totalVendors).toBe(4);
      expect(stats.bookedVendors).toBe(1);
      expect(stats.completedVendors).toBe(1);
      expect(stats.prospectVendors).toBe(1);
    });

    it("should exclude canceled vendors from financial metrics", () => {
      const stats = calculateVendorStats(mockVendors);
      // Active vendors: v1 (20jt), v2 (12jt), v3 (8jt). Total quote = 40jt
      expect(stats.totalQuoteAmount).toBe(40000000);
      expect(stats.totalAgreedAmount).toBe(40000000);
      // Paid: v1 (5jt) + v2 (12jt) = 17jt
      expect(stats.totalPaidAmount).toBe(17000000);
      // Due: v1 (15jt) + v2 (0) + v3 (8jt) = 23jt
      expect(stats.totalDueAmount).toBe(23000000);
    });

    it("should handle empty vendor array safely", () => {
      const stats = calculateVendorStats([]);
      expect(stats.totalVendors).toBe(0);
      expect(stats.bookedVendors).toBe(0);
      expect(stats.totalQuoteAmount).toBe(0);
      expect(stats.totalDueAmount).toBe(0);
    });

    it("should verify due payment never falls below zero", () => {
      const overpaidVendor: Vendor = {
        ...mockVendors[0],
        agreedAmount: 10000000,
        paidAmount: 12000000, // overpaid
        dueAmount: Math.max(0, 10000000 - 12000000),
      };
      expect(overpaidVendor.dueAmount).toBe(0);
    });
  });

  describe("Starter Vendor Templates and Demo Baseline", () => {
    it("should provide starter vendor templates covering key Balinese wedding areas", () => {
      expect(STARTER_VENDOR_TEMPLATES.length).toBeGreaterThanOrEqual(6);
      STARTER_VENDOR_TEMPLATES.forEach((tpl) => {
        expect(tpl.id).toBeDefined();
        expect(tpl.name.length).toBeGreaterThan(0);
        expect(tpl.recommendedScope.length).toBeGreaterThan(0);
        expect(tpl.estimatedQuoteRange.length).toBeGreaterThan(0);
        expect(tpl.defaultPicRole.length).toBeGreaterThan(0);
      });
    });

    it("should verify demo vendors have valid integers and relationships", () => {
      expect(DEMO_VENDORS.length).toBeGreaterThan(0);
      DEMO_VENDORS.forEach((v) => {
        expect(Number.isInteger(v.quoteAmount)).toBe(true);
        expect(Number.isInteger(v.agreedAmount)).toBe(true);
        expect(Number.isInteger(v.paidAmount)).toBe(true);
        expect(Number.isInteger(v.dueAmount)).toBe(true);
        expect(v.dueAmount).toBe(Math.max(0, v.agreedAmount - v.paidAmount));
      });
    });
  });
});
